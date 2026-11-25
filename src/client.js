'use strict';

const { Client, Collection, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const { CooldownManager } = require('./lib/cooldowns');
const { logger } = require('./lib/logger');

/** How often expired cooldowns are removed from memory. */
const COOLDOWN_SWEEP_INTERVAL_MS = 60_000;

/**
 * The bot's Discord client. It extends the discord.js `Client` with the template's
 * command collections, config and helpers, so they are available (and typed) everywhere.
 */
class BotClient extends Client {
	/** @type {NodeJS.Timeout | null} */
	#cooldownSweepTimer = null;

	/** @param {Readonly<import('./env').Env>} env */
	constructor(env) {
		super({
			// Only request what the template uses. Add intents here when your features need them,
			// e.g. GatewayIntentBits.GuildMembers for member join events. Privileged intents
			// (GuildMembers, GuildPresences, MessageContent) must also be enabled in the Developer Portal.
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent, // Needed to read prefix commands.
			],
			// Never ping @everyone, @here or roles unless a message explicitly allows it.
			allowedMentions: { parse: ['users'], repliedUser: true },
		});

		/** Validated environment variables. */
		this.env = env;
		/** Settings from `src/config.js`. */
		this.config = config;
		this.logger = logger;

		/** @type {Collection<string, import('./handlers/commandHandler').LoadedSlashCommand>} */
		this.slashCommands = new Collection();
		/** @type {Collection<string, import('./handlers/commandHandler').LoadedPrefixCommand>} */
		this.prefixCommands = new Collection();
		/** Maps each prefix command alias to the command's name. @type {Collection<string, string>} */
		this.prefixAliases = new Collection();
		/** Maps slash command names to the IDs Discord gave them, used for clickable mentions. @type {Collection<string, string>} */
		this.commandIds = new Collection();

		this.cooldowns = new CooldownManager();
		/** Timer rotating the bot's activity, started once the bot is ready. @type {NodeJS.Timeout | null} */
		this.presenceTimer = null;
	}

	/**
	 * Finds a prefix command by name or alias (case-insensitive).
	 *
	 * @param {string} name
	 * @returns {import('./handlers/commandHandler').LoadedPrefixCommand | undefined}
	 */
	getPrefixCommand(name) {
		const key = name.toLowerCase();
		return this.prefixCommands.get(key) ?? this.prefixCommands.get(this.prefixAliases.get(key) ?? '');
	}

	/**
	 * @param {string} userId
	 * @returns {boolean} Whether the user is listed in `DEVELOPER_IDS`.
	 */
	isDeveloper(userId) {
		return this.env.developerIds.includes(userId);
	}

	/** @param {string} token */
	async login(token) {
		this.#cooldownSweepTimer ??= setInterval(() => this.cooldowns.sweep(), COOLDOWN_SWEEP_INTERVAL_MS).unref();
		return super.login(token);
	}

	/** Stops the bot's timers and closes the connection to Discord. */
	async destroy() {
		clearInterval(this.#cooldownSweepTimer ?? undefined);
		clearInterval(this.presenceTimer ?? undefined);
		this.#cooldownSweepTimer = null;
		this.presenceTimer = null;
		await super.destroy();
	}
}

module.exports = { BotClient };
