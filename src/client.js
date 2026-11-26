const { Client, Collection, GatewayIntentBits } = require('discord.js');
const config = require('./config');
const { CooldownManager } = require('./lib/cooldowns');

class BotClient extends Client {
	constructor(env) {
		super({
			// Add more intents when your features need them. Privileged ones (GuildMembers,
			// GuildPresences, MessageContent) must also be turned on in the Developer Portal.
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

		this.slashCommands = new Collection();
		this.prefixCommands = new Collection();
		this.prefixAliases = new Collection();
		this.failedSlashCommandFiles = [];

		this.cooldowns = new CooldownManager();
		// Forget expired cooldowns every minute.
		this.cooldownSweepTimer = setInterval(() => this.cooldowns.sweep(), 60_000).unref();
		this.presenceTimer = null;
	}

	getPrefixCommand(name) {
		const key = name.toLowerCase();
		return this.prefixCommands.get(this.prefixAliases.get(key) ?? key);
	}

	countMembers() {
		return this.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0);
	}

	isDeveloper(userId) {
		return this.env.developerIds.includes(userId);
	}

	async destroy() {
		clearInterval(this.cooldownSweepTimer);
		clearInterval(this.presenceTimer);
		await super.destroy();
	}
}

module.exports = { BotClient };
