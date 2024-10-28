const { SlashCommandBuilder, ButtonStyle } = require("discord.js");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");
const { createDeck, shuffleDeck, dealCard, bjCalcPoints, splitOptions, displayCard } = require("../utils/deckFunctions");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("blackjack")
        .setDescription("Player closest to 21 wins.")
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("The bet amount.")
                .setRequired(true)
        ),
    async execute(interaction, profileData) {
        const { username, id } = interaction.user;
        let { balance } = profileData;
        const gambleEmbed = new EmbedBuilder().setColor(0x00aa6d);
        const amount = interaction.options.getInteger("amount");

        // Can't bet more than in balance 
        if (balance < amount) {
            await interaction.deferReply({ ephemeral: true });
            return await interaction.editReply(`You don't have $${amount} to gamble with`);
        }

        await interaction.deferReply();

        // Create deck and hands
        let bet = amount;
        let deck;
        const deck1 = shuffleDeck(createDeck());
        const deck2 = shuffleDeck(deck1.concat(createDeck()));
        let deck3 = shuffleDeck(deck2.concat(createDeck()));
        for (let i = 0; i < 10; i++) {
            deck = shuffleDeck(deck3);
        }
        let playerHand = [],
            dealerHand = [];

        // Deal two cards to player and dealer / calc points
        playerHand.push(dealCard(deck));
        dealerHand.push(dealCard(deck));
        let dealerPoints = bjCalcPoints(dealerHand);
        playerHand.push(dealCard(deck));
        dealerHand.push(dealCard(deck));
        let playerPoints = bjCalcPoints(playerHand);

        // Description
        const displayPlayerHand = displayCard(playerHand[0]) + ", " + displayCard(playerHand[1]);
        const displayDealerHand = displayCard(dealerHand[0]) + ", 🃏";
        const description = `### **Dealer**: ${dealerPoints}\n # ${displayDealerHand}\n ### **Player**: ${playerPoints}\n # ${displayPlayerHand}`;

        // Split options
        let splitResult = splitOptions(playerHand);
        let doubleResult = false;
        if ((bet * 2) > balance) {
            doubleResult = true;
        }

        gambleEmbed
            .setTitle(`Blackjack | Bet: $${amount} doubloon(s)`)
            .setFooter({ text: "Pick either \"HIT\", \"STAND\", \"DOUBLE\", or \"SPLIT\"." })
            .setDescription(description)
            .setColor(0xadd8e6); // Set initial embed color

        const Button1 = new ButtonBuilder()
            .setCustomId("hit")
            .setLabel("HIT")
            .setStyle(ButtonStyle.Success);
        const Button2 = new ButtonBuilder()
            .setCustomId("stand")
            .setLabel("STAND")
            .setStyle(ButtonStyle.Secondary);
        const Button3 = new ButtonBuilder()
            .setCustomId("double")
            .setLabel("DOUBLE")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(doubleResult);
        const Button4 = new ButtonBuilder()
            .setCustomId("split")
            .setLabel("SPLIT")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(splitResult);

        const row = new ActionRowBuilder().addComponents(
            Button1,
            Button2,
            Button3,
            Button4
        );

        // Reply with the initial embed and components
        await interaction.editReply({ embeds: [gambleEmbed], components: [row] });

        // Gather message from embed
        const message = await interaction.fetchReply();

        const filter = (i) => i.user.id == interaction.user.id;

        // Create a collector for user choices
        const collector = message.createMessageComponentCollector({
            filter,
            time: 120000, // Collect choices for 2 mins
        });

        // Event listener for when a user makes a choice
        collector.on("collect", async (i) => {

            // This will be "hit", "stand", "double", or "split"
            const chosenOption = i.customId;

            // Function to update balance in database
            async function updateBal(result, double) {
                let newBal = 0;
                let increase = amount;
                if (double) {
                    increase = increase * 2;
                }

                if (result) {
                    newBal = balance + increase;
                } else {
                    newBal = balance - increase;
                }

                await profileModel.findOneAndUpdate(
                    { userID: id },
                    { $set: { balance: newBal } }
                );
            }

            // Function to update description in embed
            function updatedDescription() {
                const updatedPlayerHandDisplay = playerHand.map(card => displayCard(card)).join(", ");
                const updatedDealerHandDisplay = dealerHand.map(card => displayCard(card)).join(", ");
                const updateDealerPoints = bjCalcPoints(dealerHand);
                const updatePlayerPoints = bjCalcPoints(playerHand);
                return `### **Dealer**: ${updateDealerPoints}\n # ${updatedDealerHandDisplay}\n ### **Player**: ${updatePlayerPoints}\n # ${updatedPlayerHandDisplay}`;
            }

            // Function to update final embed based on game result
            function updateFinalEmbed(result, tie, double) {
                const finalEmbed = new EmbedBuilder();
                let increase = amount * 2;

                if (tie) {
                    finalEmbed.setTitle(`Blackjack | It's a TIE`);
                    finalEmbed.setDescription(updatedDescription());
                    finalEmbed.setColor(0xadd8e6); // Blue for tie
                } else if (result) {
                    finalEmbed.setTitle(`Blackjack | You win $${amount}!`);
                    finalEmbed.setDescription(updatedDescription());
                    finalEmbed.setColor(0x00aa6d); // Green for winner
                } else {
                    finalEmbed.setTitle(`Blackjack | You lost $${amount}`);
                    finalEmbed.setDescription(updatedDescription());
                    finalEmbed.setColor(0xff6961); // Red for loser
                }
                if (double && result) {
                    finalEmbed.setTitle(`Blackjack | You win $${increase}!`);
                    finalEmbed.setDescription(updatedDescription());
                    finalEmbed.setColor(0x00aa6d); // Green for winner
                } else if (double && result == false) {
                    finalEmbed.setTitle(`Blackjack | You lost $${increase}`);
                    finalEmbed.setDescription(updatedDescription());
                    finalEmbed.setColor(0xff6961); // Red for loser
                }
                return finalEmbed;
            }

            // Function to determine winner
            async function giveResults(double) {
                // Draw cards for dealer until their points are over 17
                dealerPoints = bjCalcPoints(dealerHand);
                while (dealerPoints < 17) {
                    dealerHand.push(dealCard(deck));
                    dealerPoints = bjCalcPoints(dealerHand);
                }

                // dealer win
                if ((dealerPoints > playerPoints && dealerPoints <= 21) || (playerPoints > 21)) {
                    await updateBal(false, double);
                    const finalEmbed = updateFinalEmbed(false, false, double);
                    await i.reply({ embeds: [finalEmbed], ephemeral: false });

                    // player win
                } else if (dealerPoints < playerPoints || dealerPoints > 21) {
                    await updateBal(true, double);
                    const finalEmbed = updateFinalEmbed(true, false, double);
                    await i.reply({ embeds: [finalEmbed], ephemeral: false });

                    // tie
                } else if (dealerPoints === playerPoints) {
                    const finalEmbed = updateFinalEmbed(true, true, double);
                    await i.reply({ embeds: [finalEmbed], ephemeral: false });
                }
            }

            // Logic for blackjack game
            switch (chosenOption) {
                //---hit-------------------------------------------------------- 
                case "hit":
                    // Draw a card for the player
                    playerHand.push(dealCard(deck));
                    playerPoints = bjCalcPoints(playerHand);

                    // Check if player busts (points over 21)
                    if (playerPoints > 21) {
                        await updateBal(false, false);
                        const finalEmbed = updateFinalEmbed(false, false);
                        await i.reply({ embeds: [finalEmbed], ephemeral: false });
                        collector.stop();
                    } else {
                        // Update description in gamble embed
                        const updatedPlayerHandDisplay = playerHand.map(card => displayCard(card)).join(", ");
                        const description = `### **Dealer**: ${dealerPoints}\n # ${displayDealerHand}\n ### **Player**: ${playerPoints}\n # ${updatedPlayerHandDisplay}`;
                        Button3.setDisabled(true);
                        gambleEmbed.setDescription(description);
                        await i.update({ embeds: [gambleEmbed], components: [row] });
                    }
                    break;

                //---stand-------------------------------------------------------- 
                case "stand":
                    // Determine game result and update balance and final embed
                    giveResults(false);
                    collector.stop();
                    break;

                //---double-------------------------------------------------------- 
                case "double":
                    // Draw a card for the player
                    playerHand.push(dealCard(deck));
                    playerPoints = bjCalcPoints(playerHand);

                    // Determine game result and update balance and final embed
                    const double = true;
                    giveResults(double);
                    collector.stop();
                    break;

                //---split--------------------------------------------------------
                case "split":
                    // Create two new hands and deal one card to each hand
                    let hand1 = [playerHand[0], dealCard(deck)];
                    let hand2 = [playerHand[1], dealCard(deck)];
                    let hand1Points = bjCalcPoints(hand1);
                    let hand2Points = bjCalcPoints(hand2);

                    // update embed
                    // update bet 
                    // update hit 
                    // move to next hand 

                    collector.stop();
                    break;

                default:
                    break;
            }
        });

        // Handle collector timeout
        collector.on("end", (collected) => {
            if (collected.size === 0) {
                interaction.editReply("BlackJack game timed out.");
            }
        });
    },
};
