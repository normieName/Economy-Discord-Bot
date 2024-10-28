const { SlashCommandBuilder } = require("discord.js");
const parseMilliseconds = require("parse-ms-2"); // clock
const profileModel = require("../models/profileSchema"); //user data

module.exports = {
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Reddem free coins everyday."),
    async execute(interaction, profileData) {
        const { id } = interaction.user;
        const { dailyLastUsed } = profileData;

        // 86400000 - 24 hrs 
        const cooldown = 86400000;
        const timeLeft = cooldown - (Date.now() - dailyLastUsed);

        // Displays cooldown
        if (timeLeft > 0) {
            const { hours, minutes, seconds } = parseMilliseconds(timeLeft);
            await interaction.reply({
                content: `Claim your next daily in ${hours} hrs ${minutes} min ${seconds} sec`,
                ephemeral: true,
            });
            return;
        }
        await interaction.deferReply();

        // Changees balance 
        try {
            await profileModel.findOneAndUpdate(
                { userID: id },
                {
                    $set: { dailyLastUsed: Date.now() },
                    $inc: { balance: 250 },
                }
            );
        } catch (err) {
            console.log(err);
        }

        await interaction.editReply(`You redeemed 500 doubloons!`);
    },
};