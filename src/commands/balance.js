const { SlashCommandBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Shows a user's balance")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user's balance you want to see.")
                .setRequired(false)
        ),
    async execute(interaction, profileData) {
        // Fetch the mentioned user if provided
        const mentionedUser = interaction.options.getUser("user");

        // If a user is mentioned, show their balance
        if (mentionedUser) {
            const mentionedProfileData = await profileModel.findOne({ userID: mentionedUser.id });
            if (mentionedProfileData) {
                await interaction.reply(`${mentionedUser.username} has ${mentionedProfileData.balance} doubloons.`);
            } else {
                await interaction.reply(`${mentionedUser.username} is not in the system.`);
            }
        } else {
            // If no user is mentioned, show the balance of the user who invoked the command
            const { balance } = profileData;
            const username = interaction.user.username;
            await interaction.reply(`${username} has ${balance} doubloons.`);
        }
    },
};
