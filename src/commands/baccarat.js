const { SlashCommandBuilder, ButtonStyle } = require("discord.js");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("@discordjs/builders");
const { createDeck, shuffleDeck, dealCard, createImages, calculatePoints, displayCard } = require("../utils/deckFunctions");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("baccarat")
        .setDescription("Bet on the hand closest to nine.")
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("Bet amount")
                .setRequired(true)
        ),
    async execute(interaction, profileData) {
        const { username, id } = interaction.user;
        let { balance } = profileData;
        const images = createImages(0);

        const gambleEmbed = new EmbedBuilder().setColor(0x00aa6d);

        const amount = interaction.options.getInteger("amount");

        // Can't bet more than in balance 
        if (balance < amount) {
            await interaction.deferReply({ ephemeral: true });
            return await interaction.editReply(`You don't have $${amount} to gamble with`);
        }

        await interaction.deferReply();

        const Button1 = new ButtonBuilder()
            .setCustomId("player")
            .setLabel("Player")
            .setStyle(ButtonStyle.Primary);
        const Button2 = new ButtonBuilder()
            .setCustomId("banker")
            .setLabel("Banker")
            .setStyle(ButtonStyle.Primary);
        const Button3 = new ButtonBuilder()
            .setCustomId("tie")
            .setLabel("Tie")
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(
            Button1,
            Button2,
            Button3
        );

        gambleEmbed
            .setTitle(`Baccarat | Bet: $${amount} doubloons(s)`)
            .setFooter({ text: "Pick either \"PLAYER\", \"BANKER\", or \"TIE\"." })
            .setImage(images);

        // Reply with the embed and components
        await interaction.editReply({ embeds: [gambleEmbed], components: [row] });

        // Gather message from embed
        const message = await interaction.fetchReply();

        const filter = (i) => i.user.id == interaction.user.id;

        // Create a collector for user choices
        const collector = message.createMessageComponentCollector({
            filter,
            time: 60000, // Collect choices for 60 seconds
        });

        // Event listener for when a user makes a choice
        collector.on("collect", async (i) => {
            const chosenOption = i.customId; // This will be "player", "banker", or "tie"
            let resultMessage = "";

            // Logic to determine the winner based on the chosen option
            const deck = shuffleDeck(createDeck());
            let playerHand = [],
                bankerHand = [];

            // Deal two cards to player and banker
            playerHand.push(dealCard(deck));
            bankerHand.push(dealCard(deck));
            playerHand.push(dealCard(deck));
            bankerHand.push(dealCard(deck));

            // Calculate points for player and banker
            const playerPoints = calculatePoints(playerHand);
            const bankerPoints = calculatePoints(bankerHand);
            let newBal = 0;

            // Determine the winner based on points and chosen option
            if (chosenOption === "player" && playerPoints > bankerPoints) {
                resultMessage = `You won $${amount}`;
                newBal += amount;
            } else if (chosenOption === "player" && playerPoints < bankerPoints) {
                resultMessage = `You lose $${amount}`;
                newBal -= amount;
            } else if (chosenOption === "banker" && bankerPoints > playerPoints) {
                resultMessage = `You won $${amount}`;
                newBal += amount;
            } else if (chosenOption === "banker" && bankerPoints < playerPoints) {
                resultMessage = `You lose $${amount}`;
                newBal -= amount;
            } else if (chosenOption === "tie" && playerPoints === bankerPoints) {
                resultMessage = `You win $${amount * 8}`;
                newBal += (8 * amount);
            } else if (chosenOption === "tie" && playerPoints != bankerPoints) {
                resultMessage = `You lose $${amount}`;
                newBal -= amount;
            } else if (chosenOption != "tie" && playerPoints === bankerPoints) {
                resultMessage = "It's a tie";
            } else {
                resultMessage = "Invalid option!";
            }

            // Update the user's balance in the database
            await profileModel.findOneAndUpdate(
                { userID: id },
                { $set: { balance: balance + newBal } }
            );

            // Display Cards
            const displayPlayerHand = displayCard(playerHand[0]) + " and " + displayCard(playerHand[1]);
            const displayBankerHand = displayCard(bankerHand[0]) + " and " + displayCard(bankerHand[1]);
            const description = `### **Player**: ${playerPoints}\n ## ${displayPlayerHand}\n ### **Banker**: ${bankerPoints}\n ## ${displayBankerHand}`;


            // Construct final embed with result message
            const finalEmbed = new EmbedBuilder()
                .setColor(0x00aa6d)
                .setTitle(`Baccarat | ${resultMessage}`)
                .setDescription(description);


            // Reply with the final embed
            await i.reply({ embeds: [finalEmbed], ephemeral: false });
            console.log(displayPlayerHand);
            console.log(playerPoints);
            console.log(displayBankerHand);
            console.log(bankerPoints);

            // Stop collecting further choices
            collector.stop();
        });

        // Handle collector timeout
        collector.on("end", (collected) => {
            if (collected.size === 0) {
                // If no choices were collected
                interaction.editReply("Baccarat game timed out.");
            }
        });

    },
};
