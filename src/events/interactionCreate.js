const { Events } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        // Get user DB information and pass to command
        let profileData;
        try {
            profileData = await profileModel.findOne({ userID: interaction.user.id });
            if (!profileData) {
                profileData = await profileModel.create({
                    userID: interaction.user.id,
                    serverID: interaction.guild.id,
                });
            }
        } catch (err) {
            console.log(err);
        }

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(
                `No command matching ${interaction.commandName} was found.`
            );
            return;
        }

        try {
            await command.execute(interaction, profileData);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}`);
            console.error(error);
        }
    },
};