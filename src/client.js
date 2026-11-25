'use strict';

const { Client, Collection, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const { CooldownManager } = require('./lib/cooldowns');
const { logger } = require('./lib/logger');

/**
 * The bot's Discord client: the discord.js `Client` plus the template's commands, config and helpers.
 * Every command and event receives it, so anything you add here is available everywhere.
 */
class BotClient extends Client {
	/** @param {Readonly<import('./env').Env>} env */
	constructor(env) {
		super({
			// Only the intents the template needs. Add more when your features need them, e.g.
			// GatewayIntentBits.GuildMembers for member join events. Privileged intents (GuildMembers,
			// GuildPresences, MessageContent) must also be enabled on the Bot page of the Developer Portal.
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent, // Needed to read prefix commands.
			],
			// Don't ping @everyone, @here or roles unless a message explicitly allows it.
			allowedMentions: { parse: ['users'], repliedUser: true },
		});

		this.env = env;
		this.config = config;
		this.logger = logger;

		/** @type {Collection<string, import('./handlers/commandHandler').LoadedSlashCommand>} */
		this.slashCommands = new Collection();
		/** @type {Collection<string, import('./handlers/commandHandler').LoadedPrefixCommand>} */
		this.prefixCommands = new Collection();
		/** @type {Collection<string, string>} Prefix command alias → command name. */
		this.prefixAliases = new Collection();
		/** @type {Collection<string, string>} Slash command name → ID, used for clickable mentions in `/help`. */
		this.commandIds = new Collection();
		/** @type {string[]} Slash command files that failed to load. Commands aren't registered while this has entries. */
		this.failedSlashCommandFiles = [];

		this.cooldowns = new CooldownManager();
		// Forget expired cooldowns every minute. `unref()` lets the process exit without waiting for it.
		this.cooldownSweepTimer = setInterval(() => this.cooldowns.sweep(), 60_000).unref();
		/** @type {NodeJS.Timeout | null} Set by `startPresenceRotation()` once the bot is ready. */
		this.presenceTimer = null;
	}

	/**
	 * Finds a prefix command by its name or one of its aliases, ignoring case.
	 *
	 * @param {string} name
	 */
	getPrefixCommand(name) {
		const key = name.toLowerCase();
		return this.prefixCommands.get(key) ?? this.prefixCommands.get(this.prefixAliases.get(key) ?? '');
	}

	/** The total number of members across every server the bot is in. */
	countMembers() {
		return this.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
	}

	/**
	 * Whether the user is listed in `DEVELOPER_IDS`.
	 *
	 * @param {string} userId
	 */
	isDeveloper(userId) {
		return this.env.developerIds.includes(userId);
	}

	/** Stops the bot's timers and closes the connection to Discord. */
	async destroy() {
		clearInterval(this.cooldownSweepTimer);
		clearInterval(this.presenceTimer);
		await super.destroy();
	}
}

module.exports = { BotClient };
