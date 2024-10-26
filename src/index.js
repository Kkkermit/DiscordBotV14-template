
// ██████╗ ███████╗██╗   ██╗    ██████╗ ██╗   ██╗    ██╗  ██╗██╗  ██╗███████╗██████╗ ███╗   ███╗██╗████████╗
// ██╔══██╗██╔════╝██║   ██║    ██╔══██╗╚██╗ ██╔╝    ██║ ██╔╝██║ ██╔╝██╔════╝██╔══██╗████╗ ████║██║╚══██╔══╝
// ██║  ██║█████╗  ██║   ██║    ██████╔╝ ╚████╔╝     █████╔╝ █████╔╝ █████╗  ██████╔╝██╔████╔██║██║   ██║   
// ██║  ██║██╔══╝  ╚██╗ ██╔╝    ██╔══██╗  ╚██╔╝      ██╔═██╗ ██╔═██╗ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║   
// ██████╔╝███████╗ ╚████╔╝     ██████╔╝   ██║       ██║  ██╗██║  ██╗███████╗██║  ██║██║ ╚═╝ ██║██║   ██║   
// ╚═════╝ ╚══════╝  ╚═══╝      ╚═════╝    ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝   ╚═╝   

// Developed by: Kkermit. All rights reserved. (2024)
// MIT License

const { Client, GatewayIntentBits, Collection, Partials } = require(`discord.js`);
const fs = require('fs');
const config = require('./config');
const { color, getTimestamp } = require('./utils/logEffects');
const { checkVersion } = require('./lib/version')

// Current Repo Version //

const currentVersion = `${config.botVersion}`;

let client;
try {
    client = new Client({ 
        intents: [
            GatewayIntentBits.Guilds, 
            GatewayIntentBits.GuildMessages, 
            GatewayIntentBits.MessageContent, 
            GatewayIntentBits.GuildMembers, 
            GatewayIntentBits.GuildPresences, 
            GatewayIntentBits.GuildIntegrations, 
            GatewayIntentBits.GuildWebhooks, 
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.MessageContent, 
            GatewayIntentBits.GuildEmojisAndStickers, 
            GatewayIntentBits.DirectMessages, 
            GatewayIntentBits.DirectMessageTyping, 
            GatewayIntentBits.GuildModeration, 
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildWebhooks, 
            GatewayIntentBits.AutoModerationConfiguration,
            GatewayIntentBits.GuildScheduledEvents, 
            GatewayIntentBits.GuildMessageTyping, 
            GatewayIntentBits.AutoModerationExecution, 
        ],  

        partials: [
            Partials.GuildMember, 
            Partials.Channel,
            Partials.GuildScheduledEvent,
            Partials.Message,
            Partials.Reaction, 
            Partials.ThreadMember, 
            Partials.User
        ],
    }); 
} catch (error) {
    console.error(`${color.red}[${getTimestamp()}]${color.reset} [ERROR] Error while creating the client. \n${color.red}[${getTimestamp()}]${color.reset} [ERROR]`, error);
};

client.logs = require('./utils/logs');
client.config = require('./config');

require('./functions/processHandlers')();

client.commands = new Collection();
client.pcommands = new Collection();
client.aliases = new Collection();

require('dotenv').config();

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const triggerFiles = fs.readdirSync("./src/triggers").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events")
const pcommandFolders = fs.readdirSync('./src/prefix');
const commandFolders = fs.readdirSync("./src/commands");

const token = process.env.token;
if (!token) {
    console.log(`${color.red}[${getTimestamp()}]${color.reset} [TOKEN] No token provided. Please provide a valid token in the .env file. ${config.botName} cannot launch without a token.`);
    return;
}

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleTriggers(triggerFiles, "./src/triggers")
    client.handleCommands(commandFolders, "./src/commands");
    client.prefixCommands(pcommandFolders, './src/prefix');
    client.login(token).then(() => {
        checkVersion(currentVersion);
    }).catch((error) => {
        console.error(`${color.red}[${getTimestamp()}]${color.reset} [LOGIN] Error while logging into ${config.botName}. Check if your token is correct or double check your also using the correct intents. \n${color.red}[${getTimestamp()}]${color.reset} [LOGIN]`, error);
    });
})();
