const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const ascii = require("ascii-table");
const table = new ascii().setHeading("File Name", "Status");

const clientId = process.env.clientid; 
const guildId = process.env.guildid; 

module.exports = (client) => {
    client.handleCommands = async (commandFolders, path) => {
        client.commandArray = [];
        for (folder of commandFolders) {
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`../commands/${folder}/${file}`);
                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON());

                if (command.name) {
                    client.commands.set(command.name, command);
                    table.addRow(file, "✅");
            
                    if (command.aliases && Array.isArray(command.aliases)) {
                      command.aliases.forEach((alias) => {
                        client.aliases.set(alias, command.name);
                      });
                    }
                  } else {
                    table.addRow(file, "✅");
                    continue;
                  }
            }
        }

        const color = {
            red: '\x1b[31m',
            orange: '\x1b[38;5;202m',
            yellow: '\x1b[33m',
            green: '\x1b[32m',
            blue: '\x1b[36m',
            reset: '\x1b[0m',
        }

        console.log(`${color.green}${table.toString()}, \n✅ Loaded Slash Commands`);

        const rest = new REST({
            version: '9'
        }).setToken(process.env.token);

        (async () => {
            try {
                console.log(`${color.yellow}[ DJS ] Started refreshing application (/) commands.`);

                await rest.put(
                    Routes.applicationCommands(clientId), {
                        body: client.commandArray
                    },
                );

                console.log(`${color.yellow}[ DJS ] Successfully reloaded application (/) commands.`);
            } catch (error) {
                console.error(error);
            }
        })();
    };
};