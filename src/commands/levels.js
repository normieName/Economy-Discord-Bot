const { SlashCommandBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("level")
        .setDescription("Displays current level and xp."),
    async execute(interaction, profileData) {
        const { level } = profileData;
        const { xp } = profileData;
        await interaction.reply(`Level: ${level}\nXP: ${xp}`);
    },
};