const { 
    Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, Permissions, MessageManager, Embed, Collection, Events, Partials, ActivityType, Activity, AuditLogEvent, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType
    } = require(`discord.js`);
const fs = require('fs');

// Current Repo Version //

const currentVersion = "v2.0.2";

const client = new Client({
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
    ]
}); 

client.logs = require('./utils/logs');
client.config = require('./config');

const { checkVersion } = require('./lib/version')

// Rotating Activity //

client.on("ready", async (client) => {
    try {
        setInterval(() => {

            let activities = [
                { type: 'Watching', name: `${client.commands.size} slash commands!`},
                { type: 'Watching', name: `${client.pcommands.size} prefix commands!`},
                { type: 'Watching', name: `${client.guilds.cache.size} servers!`},
                { type: 'Watching', name: `${client.guilds.cache.reduce((a,b) => a+b.memberCount, 0)} members!`},
                { type: 'Playing', name: `${client.config.prefix}help | @${client.user.username}`},
            ];

            const status = activities[Math.floor(Math.random() * activities.length)];

            if (status.type === 'Watching') {
                client.user.setPresence({ activities: [{ name: `${status.name}`, type: ActivityType.Watching }]});
            } else {
                client.user.setPresence({ activities: [{ name: `${status.name}`, type: ActivityType.Playing }]});
            } 
        }, 7500);
        client.logs.success(`[STATUS] Rotating status loaded successfully.`);
    } catch (error) {
        client.logs.error(`[STATUS] Error while loading rotating status.`);
    };
});

// Status //

client.on("ready", () => {
    try {
        client.user.setStatus(client.config.status);
        client.logs.success(`[STATUS] Bot status loaded as ${client.config.status}.`);
    } catch (error) {
        client.logs.error(`[STATUS] Error while loading bot status.`);
    };
});

require('./functions/processHandlers')();

client.commands = new Collection();
client.pcommands = new Collection();
client.aliases = new Collection();

require('dotenv').config();

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const triggerFiles = fs.readdirSync("./src/triggers").filter(file => file.endsWith(".js"));
const pcommandFolders = fs.readdirSync('./src/prefix');
const commandFolders = fs.readdirSync("./src/commands");

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleTriggers(triggerFiles, "./src/triggers")
    client.handleCommands(commandFolders, "./src/commands");
    client.prefixCommands(pcommandFolders, './src/prefix');
    client.login(process.env.token).then(() => {
        checkVersion(currentVersion);
    }).catch((error) => {
        console.error(`${color.red}[${getTimestamp()}]${color.reset} [LOGIN] Error while logging in. Check if your token is correct or double check your also using the correct intents. \n${color.red}[${getTimestamp()}]${color.reset} [LOGIN]`, error);
    });
})();

// Logging Effects //

const color = {
    red: '\x1b[31m',
    orange: '\x1b[38;5;202m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    pink: '\x1b[38;5;213m',
    torquise: '\x1b[38;5;45m',
    purple: '\x1b[38;5;57m',
    reset: '\x1b[0m'
}

function getTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Guild Create //

client.on("guildCreate", async guild => {
    try{ 
        let theowner = process.env.devid; 
        const channel2 = await guild.channels.cache.random()
        const channelId = channel2.id;
        const invite = await guild.invites.create(channelId)

        await guild.fetchOwner().then(({ user }) => { theowner = user; }).catch(() => {});

        console.log(`${color.orange}[${getTimestamp()}]${color.reset} [GUILD_CREATE] ${client.user.username} has been added to a new guild. \n${color.orange}> GuildName: ${guild.name} \n> GuildID: ${guild.id} \n> Owner: ${theowner ? `${theowner.tag} (${theowner.id})` : `${theowner} (${guild.ownerId})`} \n> MemberCount: ${guild.memberCount} \n> ServerNumber: ${client.guilds.cache.size} \n> ServerInvite: ${invite}`)
    } catch (error) {
        client.logs.error(`[GUILD_CREATE] Error while logging guild creation.`);
    }
});

// Guild Delete //

client.on("guildDelete", async guild => {
    try {
        let theowner = process.env.devid;

        await guild.fetchOwner().then(({ user }) => { theowner = user; }).catch(() => {});

        console.log(`${color.blue}[${getTimestamp()}]${color.reset} [GUILD_DELETE] ${client.user.username} has left a guild. \n${color.blue}> GuildName: ${guild.name} \n> GuildID: ${guild.id} \n> Owner: ${theowner ? `${theowner.tag} (${theowner.id})` : `${theowner} (${guild.ownerId})`} \n> MemberCount: ${guild.memberCount}`)
    } catch (error) {
        client.logs.error(`[GUILD_DELETE] Error while logging guild deletion.`);
    }
});

// Command Logging //

client.on(Events.InteractionCreate, async interaction => {
    
    if (!interaction) return;
    if (!interaction.isChatInputCommand()) return;
    else {
        try {

        const channel = await client.channels.cache.get(client.config.slashCommandLoggingChannel);
        const server = interaction.guild.name;
        const user = interaction.user.username;
        const userID = interaction.user.id;

        const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setAuthor({ name: `${user} has used a command.`, iconURL: client.user.avatarURL({ dynamic: true })})
        .setTitle(`${client.user.username} Command Logger`)
        .addFields({ name: 'Server Name', value: `${server}`})
        .addFields({ name: 'Command', value: `\`\`\`${interaction}\`\`\``})
        .addFields({ name: 'User', value: `${user} | ${userID}`})
        .setTimestamp()
        .setFooter({ text: `Command Logger ${client.config.devBy}`, iconURL: interaction.user.avatarURL({ dynamic: true })})

        await channel.send({ embeds: [embed] });
        console.log(`${color.torquise}[${getTimestamp()}]${color.reset} [SLASH_COMMAND_USED] ${user} has used a command. \n${color.torquise}> Server: ${server} \n> Command: ${interaction} \n> User: ${user} \n> UserID: ${userID}`)
    } catch (error) {
        client.logs.error(`[SLASH_COMMAND_USED] Error while logging command usage. Check if you have the correct channel ID in your config.`);
    }};
});

client.on(Events.MessageCreate, async message => {

    const prefix = client.config.prefix
    if (!message.author.bot && message.content.startsWith(prefix)) {
        try {

        const channel = await client.channels.cache.get(client.config.prefixCommandLoggingChannel);
        const server = message.guild.name;
        const user = message.author.username;
        const userID = message.author.id;

        const embed = new EmbedBuilder()
        .setColor(client.config.embedColor)
        .setAuthor({ name: `${user} has used a command.`, iconURL: client.user.avatarURL({ dynamic: true }) })
        .setTitle(`${client.user.username} Command Logger`)
        .addFields({ name: 'Server Name', value: `${server}` })
        .addFields({ name: 'Command', value: `\`\`\`${message.content}\`\`\`` })
        .addFields({ name: 'User', value: `${user} | ${userID}` })
        .setTimestamp()
        .setFooter({ text: `Command Logger ${client.config.devBy}`, iconURL: message.author.avatarURL({ dynamic: true }) })

        await channel.send({ embeds: [embed] });
        console.log(`${color.purple}[${getTimestamp()}]${color.reset} [PREFIX_COMMAND_USED] ${user} has used a command. \n${color.purple}> Server: ${server} \n> Command: ${message.content} \n> User: ${user} \n> UserID: ${userID}`)
    } catch (error) {
        client.logs.error(`[PREFIX_COMMAND_USED] Error while logging command usage. Check if you have the correct channel ID in your config.`);
    }};
});