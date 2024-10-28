const { SlashCommandBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("donate")
        .setDescription("Donate your doubloons to another user.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("The user you want to donate to.")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("The amount of doubloons you want to donate.")
                .setRequired(true)
                .setMinValue(1)
        ),
    async execute(interaction, profileData) {
        const receiveUser = interaction.options.getUser("user");
        const donateAmt = interaction.options.getInteger("amount");

        const { balance } = profileData;
        if (balance < donateAmt) {
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply(`You do not have ${donateAmt} coins in your balance.`);
            return;
        }

        // Check if the recipient is in the system
        const receiveUserData = await profileModel.findOne({ userID: receiveUser.id });
        if (!receiveUserData) {
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply(`${receiveUser.username} is not in the system`);
            return;
        }

        // Update recipient's balance
        await profileModel.findOneAndUpdate(
            { userID: receiveUser.id },
            { $inc: { balance: donateAmt } }
        );

        // Update sender's balance
        await profileModel.findOneAndUpdate(
            { userID: interaction.user.id },
            { $inc: { balance: -donateAmt } }
        );

        await interaction.deferReply();
        await interaction.editReply(`You have donated ${donateAmt} doubloons to <@${receiveUser.id}>`);
    },
};
