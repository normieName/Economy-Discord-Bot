const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("@discordjs/builders");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Shows Top 10 Users"),
    async execute(interaction, profileData) {
        // Defer the reply to give the bot time to fetch the data
        await interaction.deferReply();

        // Get the username and ID of the user who invoked the command
        const { username, id } = interaction.user;
        const { balance } = profileData;

        // Initialize the embed message
        let leaderboardEmbed = new EmbedBuilder()
            .setTitle("**Top 10 Users**")
            .setColor(0x45d6fd)
            .setFooter({ text: "You are not ranked yet" });

        // Fetch all members from the profileModel sorted by balance in descending order
        let members;
        try {
            members = await profileModel.find().sort({ balance: -1 });
        } catch (err) {
            console.log(err);
            return await interaction.editReply("There was an error fetching the leaderboard.");
        }

        // Find the index of the user who invoked the command
        const memberIdx = members.findIndex((member) => member.userID == id);
        if (memberIdx !== -1) {
            leaderboardEmbed.setFooter({ text: `${username}, you are ranked #${memberIdx + 1} with ${balance}` });
        }

        // Get the top 10 members
        const topTen = members.slice(0, 10);

        // Build the description for the embed message with the top 10 members
        let desc = "";
        for (let i = 0; i < topTen.length; i++) {
            try {
                // Fetch the user details from the guild using the user ID
                let { user } = await interaction.guild.members.fetch(topTen[i].userID);
                let userBalance = topTen[i].balance;
                desc += `**${i + 1}. ${user.username}: ** $${userBalance}\n`;
            } catch (err) {
                console.log(err);
                continue;
            }
        }

        // Set the description of the embed if there are top 10 members
        if (desc !== "") {
            leaderboardEmbed.setDescription(desc);
        }

        // Edit the deferred reply with the embed message
        await interaction.editReply({ embeds: [leaderboardEmbed] });
    },
};
