const { Events } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Check for chat command
        if (!interaction.isChatInputCommand()) return;

        // Generate user xp between 1 and 5
        const xpAmount = Math.floor(Math.random() * 5) + 1;

        // Get user and guild IDs
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        let profileData;
        try {
            profileData = await profileModel.findOne({ userID: interaction.user.id });
            if (!profileData) {
                profileData = await profileModel.create({
                    userID: interaction.user.id,
                    serverID: interaction.guild.id,
                });
            }

            // Update user's XP
            profileData.xp += xpAmount;

            // Check for level-up
            const xpNeededForLevelUp = 50;
            if (profileData.xp >= xpNeededForLevelUp) {
                profileData.level++;
                profileData.xp -= xpNeededForLevelUp;

                // Save updated profile
                await profileData.save();

                // Respond with a message or embed indicating level-up
                await interaction.channel.send(`${interaction.user.username} leveled up to level ${profileData.level}!`);
            } else {
                // Save updated profile
                await profileData.save();

                // Respond with a message indicating XP increase
                //await interaction.channel.send(`XP increased by ${xpAmount}. Current XP: ${profileData.xp}`);
            }
        } catch (error) {
            console.log("Error giving XP.");
        }
    }
}