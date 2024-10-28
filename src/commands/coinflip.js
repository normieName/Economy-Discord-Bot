const { SlashCommandBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema"); // user data

module.exports = {
    data: new SlashCommandBuilder()
        .setName("coinflip")
        .setDescription("Bet on coin flip")
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("The amount of doubloons you want to bet.")
                .setRequired(true)
                .setMinValue(1)
        )
        .addStringOption((option) =>
            option
                .setName("choice")
                .setDescription("Heads or Tails.")
                .setRequired(true)
                .addChoices(
                    { name: "Heads", value: "Heads" },
                    { name: "Tails", value: "Tails" }
                )
        ),
    async execute(interaction) {
        const { id } = interaction.user;
        const choice = interaction.options.getString("choice");
        const bet = interaction.options.getInteger("amount");

        await interaction.deferReply();

        const randomNum = Math.round(Math.random());
        const result = randomNum ? "Heads" : "Tails";

        if (choice == result) {
            await profileModel.findOneAndUpdate(
                { userID: id },
                { $inc: { balance: bet } }
            );
            await interaction.editReply(`
                You chose **${choice}** and it was **${result}**\n Winner! You win ${bet} doubloons!!!`
            );
        } else {
            await profileModel.findOneAndUpdate(
                { userID: id },
                { $inc: { balance: -bet } }
            );
            await interaction.editReply(`
                You chose **${choice}** and it was **${result}**\n Loser...you lose **${bet}** doubloons...`
            );
        }

    },
};