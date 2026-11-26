const { ActivityType } = require('discord.js');

// Your bot's settings. Secrets like the bot token go in the .env file instead.
// If a value here is wrong, the bot tells you when it starts.
module.exports = {
	// Prefix for message commands, e.g. ?ping
	prefix: '?',

	// A discord.js colour name like 'Blurple' or 'Green', or a hex number like 0x5865f2.
	embedColor: 'Blurple',

	// Shown in bot-info and in embed footers.
	developerName: 'Kkermit',

	banner: {
		// Print the bot's name in big letters when it starts.
		enabled: true,
		// Try other fonts at https://patorjk.com/software/taag
		font: 'ANSI Shadow',
	},

	presence: {
		// 'online', 'idle', 'dnd' or 'invisible'.
		status: 'online',
		// Seconds between activity changes: 0 (don't change) or at least 15.
		rotateIntervalSeconds: 30,
		// The name can be text, or a function that gets the client so numbers stay up to date.
		activities: [
			{ type: ActivityType.Watching, name: (client) => `${client.guilds.cache.size} servers` },
			{ type: ActivityType.Listening, name: '/help' },
			{ type: ActivityType.Playing, name: (client) => `${client.config.prefix}help` },
		],
	},

	commands: {
		// Used when a command doesn't set its own cooldown. 0 turns it off.
		defaultCooldownSeconds: 3,
		// Allow "@YourBot ping" as well as "?ping".
		mentionAsPrefix: true,
		// Reply with a hint when someone uses a prefix command that doesn't exist.
		replyToUnknownCommands: true,
	},

	logging: {
		// A channel ID to post every command use in. Leave empty to turn it off.
		commandLogChannelId: '',
	},

	updateCheck: {
		// Check GitHub for a newer version of this template when the bot starts.
		enabled: true,
		repository: 'Kkkermit/DiscordBotV14-template',
	},

	// Replies users see. Words in {braces} are filled in automatically.
	messages: {
		error: 'Something went wrong while running this command. Please try again later.',
		noPermission: 'You **do not** have permission to use this command. Missing: {permissions}.',
		developerOnly: 'This command can only be used by the bot developers.',
		cooldown: 'Slow down! You can use this command again {time}.',
		missingArgs: 'This command needs more information. Usage: `{usage}`',
		unknownCommand: 'That command does not exist. Use `{prefix}help` to see all commands.',
	},
};
