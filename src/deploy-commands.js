require("dotenv").config();
const { REST, Routes } = require("discord.js");
const {
    CLIENT_ID: clientId,
    GUILD_ID: guildId,
    TOKEN: token,
} = process.env;
const fs = require("node:fs");
const path = require("node:path");

if (!clientId || !guildId || !token) {
    console.error("Missing CLIENT_ID, GUILD_ID, or TOKEN in .env file.");
    process.exit(1);
}

const commands = [];
const commandsPath = path.resolve(__dirname, 'commands');

// Check if commands directory exists
if (!fs.existsSync(commandsPath)) {
    console.error(`The commands directory at ${commandsPath} does not exist.`);
    process.exit(1);
}

// Grab all the command files from the commands directory
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

if (commandFiles.length === 0) {
    console.error(`No command files found in the commands directory at ${commandsPath}.`);
    process.exit(1);
}

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
    const commandPath = path.join(commandsPath, file);
    try {
        const command = require(commandPath);
        if (command && command.data && typeof command.data.toJSON === 'function') {
            commands.push(command.data.toJSON());
        } else {
            console.warn(`Skipping ${file}: command.data.toJSON() is not a function.`);
        }
    } catch (error) {
        console.error(`Error requiring command file ${commandPath}:`, error);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(token);

// Deploy commands
(async () => {
    try {
        console.log(
            `Started refreshing ${commands.length} application (/) commands.`
        );

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        console.log(
            `Successfully reloaded ${data.length} application (/) commands.`
        );
    } catch (error) {
        // Catch and log any errors
        console.error(error);
    }
})();
