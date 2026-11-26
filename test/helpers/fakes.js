const { EventEmitter } = require('node:events');
const { PermissionsBitField } = require('discord.js');
const { BotClient } = require('../../src/client');
const { loadPrefixCommands, loadSlashCommands } = require('../../src/handlers/commandHandler');
const { logger } = require('../../src/lib/logger');

// Keep test output readable: only show errors the code under test logs.
logger.setLevel('error');

const BOT_ID = '100000000000000001';
const USER_ID = '100000000000000002';
const DEVELOPER_ID = '100000000000000003';
const GUILD_ID = '100000000000000004';
const AVATAR_URL = 'https://cdn.discordapp.com/embed/avatars/0.png';

function createUser(id, username = `user${id.slice(-2)}`) {
	return {
		id,
		username,
		tag: username,
		displayName: username,
		bot: false,
		createdAt: new Date('2020-01-01T00:00:00Z'),
		displayAvatarURL: () => AVATAR_URL,
		toString: () => `<@${id}>`,
	};
}

function createClient(env = {}) {
	const client = new BotClient({
		token: 'test-token',
		developerIds: [DEVELOPER_ID],
		mongoUri: null,
		logLevel: 'error',
		...env,
	});
	client.user = { ...createUser(BOT_ID, 'TemplateBot'), bot: true, setPresence() {} };
	client.readyTimestamp = Date.now() - 90_000;

	const slash = loadSlashCommands();
	const prefix = loadPrefixCommands();
	client.slashCommands = slash.commands;
	client.prefixCommands = prefix.commands;
	client.prefixAliases = prefix.aliases;
	return client;
}

function createSentMessage(payload) {
	return {
		payload,
		edits: [],
		createdTimestamp: Date.now(),
		collector: null,
		async edit(newPayload) {
			this.edits.push(newPayload);
			return this;
		},
		createMessageComponentCollector() {
			this.collector = new EventEmitter();
			return this.collector;
		},
	};
}

function createMessage(content, { authorId = USER_ID, permissions = [] } = {}) {
	const channel = { id: '100000000000000005' };
	return {
		content,
		author: createUser(authorId),
		// The permissions the member has in this message's channel.
		member: { permissionsIn: (target) => (target === channel ? new PermissionsBitField(permissions) : null) },
		guild: { id: GUILD_ID, name: 'Test Server' },
		channel,
		channelId: channel.id,
		webhookId: null,
		system: false,
		createdTimestamp: Date.now(),
		inGuild: () => true,
		replies: [],
		async reply(payload) {
			this.replies.push(payload);
			return createSentMessage(payload);
		},
	};
}

function createInteraction(commandName, { userId = USER_ID, options = {}, focused = '' } = {}) {
	const interaction = {
		commandName,
		user: createUser(userId),
		guild: { id: GUILD_ID, name: 'Test Server' },
		guildId: GUILD_ID,
		createdTimestamp: Date.now(),
		replied: false,
		deferred: false,
		responded: false,
		replies: [],
		followUps: [],
		edits: [],
		responses: [],
		sentMessage: null,
		autocomplete: false,
		isAutocomplete() {
			return this.autocomplete;
		},
		isChatInputCommand() {
			return !this.autocomplete;
		},
		isContextMenuCommand: () => false,
		inCachedGuild: () => false,
		toString: () => `/${commandName}`,
		options: {
			getString: (name) => options[name] ?? null,
			getUser: (name) => options[name] ?? null,
			getMember: () => null,
			getFocused: () => focused,
		},
		async reply(payload) {
			this.replied = true;
			this.replies.push(payload);
			this.sentMessage = createSentMessage(payload);
			return { resource: { message: this.sentMessage } };
		},
		async editReply(payload) {
			this.edits.push(payload);
		},
		async followUp(payload) {
			this.followUps.push(payload);
		},
		async respond(choices) {
			this.responded = true;
			this.responses.push(choices);
		},
	};
	return interaction;
}

module.exports = {
	BOT_ID,
	USER_ID,
	DEVELOPER_ID,
	GUILD_ID,
	createUser,
	createClient,
	createMessage,
	createInteraction,
};
