'use strict';

const { ActivityType } = require('discord.js');

/**
 * Bot settings. Everything here is safe to commit.
 * Secrets such as your bot token belong in the `.env` file instead (see `.env.example`).
 *
 * Invalid values are reported when the bot starts, so you'll know straight away if something is wrong.
 */
module.exports = {
	/** Prefix for message ("prefix") commands, e.g. `?ping`. */
	prefix: '?',

	/** Default embed colour. Any discord.js colour name (e.g. `'Blurple'`, `'Green'`) or a hex number like `0x5865f2`. */
	embedColor: 'Blurple',

	/** Your name, shown in `bot-info` and embed footers. */
	developerName: 'Kkermit',

	banner: {
		/** Print the bot's name as ASCII art, and a short summary, once it is online. */
		enabled: true,

		/** Any figlet font, such as 'ANSI Shadow', 'Standard', 'Slant' or 'Big'. Preview them at https://patorjk.com/software/taag */
		font: 'ANSI Shadow',
	},

	presence: {
		/** One of `'online'`, `'idle'`, `'dnd'` or `'invisible'`. */
		status: 'online',

		/**
		 * Seconds between activity changes. Must be at least 15 to stay within Discord's rate limits.
		 * Set to `0` to always show the first activity.
		 */
		rotateIntervalSeconds: 30,

		/**
		 * Activities the bot cycles through. `name` can be a string or a function receiving the client,
		 * which is called every time the activity is shown so the numbers stay up to date.
		 */
		activities: [
			{ type: ActivityType.Watching, name: (client) => `${client.guilds.cache.size} servers` },
			{ type: ActivityType.Listening, name: '/help' },
			{ type: ActivityType.Playing, name: (client) => `${client.config.prefix}help` },
		],
	},

	commands: {
		/**
		 * Register slash commands with Discord every time the bot starts.
		 * Disable this if you prefer to run `npm run deploy` manually after changing commands.
		 */
		registerOnStartup: true,

		/** Cooldown (in seconds) used when a command doesn't set its own `cooldown`. `0` disables it. */
		defaultCooldownSeconds: 3,

		/** Let users run prefix commands by mentioning the bot, e.g. `@Bot ping`. */
		mentionAsPrefix: true,

		/** Reply with a hint when someone types the prefix followed by a command that doesn't exist. */
		replyToUnknownCommands: true,
	},

	logging: {
		/**
		 * Channel ID where every command use is logged as an embed. Leave empty to disable.
		 * The bot needs permission to view and send messages in that channel.
		 */
		commandLogChannelId: '',
	},

	updateCheck: {
		/** Check GitHub for a newer release of this template on startup. */
		enabled: true,

		/** The `owner/name` of the GitHub repository whose releases are checked. */
		repository: 'Kkkermit/DiscordBotV14-template',
	},

	/**
	 * Replies shown to users. `{placeholders}` are replaced automatically:
	 * `{time}` a relative timestamp, `{usage}` the command usage, `{prefix}` the prefix,
	 * `{permissions}` the missing permissions.
	 */
	messages: {
		error: 'Something went wrong while running this command. Please try again later.',
		noPermission: 'You **do not** have permission to use this command. Missing: {permissions}.',
		developerOnly: 'This command can only be used by the bot developers.',
		cooldown: 'Slow down! You can use this command again {time}.',
		missingArgs: 'This command needs more information. Usage: `{usage}`',
		unknownCommand: 'That command does not exist. Use `{prefix}help` to see all commands.',
	},
};
