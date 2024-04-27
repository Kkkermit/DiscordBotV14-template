const { 
    Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, MessageManager, Embed, Collection, Events, Partials, ActivityType, Activity, AuditLogEvent, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType
    } = require(`discord.js`);
const fs = require('fs');

const client = new Client({ intents: [
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
]

}); 

require('./functions/processHandlers')()

client.commands = new Collection();

require('dotenv').config();

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./src/commands");

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleCommands(commandFolders, "./src/commands");
    client.login(process.env.token)
})();

