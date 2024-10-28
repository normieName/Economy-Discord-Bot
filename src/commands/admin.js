const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("admin")
        .setDescription("Access to admin commands")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("add")
                .setDescription("Add money to a user balance")
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription("The user you want to deposit money")
                        .setRequired(true)
                )
                .addIntegerOption((option) =>
                    option
                        .setName("amount")
                        .setDescription("The amount of money to deposit")
                        .setRequired(true)
                        .setMinValue(1)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("subtract")
                .setDescription("Take money from a user balance")
                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setDescription("The user you want to withdraw money")
                        .setRequired(true)
                )
                .addIntegerOption((option) =>
                    option
                        .setName("amount")
                        .setDescription("The amount of money to withdraw")
                        .setRequired(true)
                        .setMinValue(1)
                )
        ),
    async execute(interaction) {
        await interaction.deferReply();
        // Get add, subtract
        const adminSubcommand = interaction.options.getSubcommand();

        if (adminSubcommand == "add") {
            const user = interaction.options.getUser("user");
            const amount = interaction.options.getInteger("amount");

            await profileModel.findOneAndUpdate(
                { userID: user.id },
                { $inc: { balance: amount } }
            );

            await interaction.editReply(
                `Added ${amount} doubloons to <@${user.id}> balance`
            );
        }

        if (adminSubcommand == "subtract") {
            const user = interaction.options.getUser("user");
            const amount = interaction.options.getInteger("amount");

            await profileModel.findOneAndUpdate(
                { userID: user.id },
                { $inc: { balance: -amount } }
            );

            await interaction.editReply(
                `Subtracted ${amount} doubloons from <@${user.id}> balance`
            );
        }
    },
};