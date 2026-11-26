const { Events, PermissionsBitField } = require('discord.js');
const { logCommandUsage } = require('../../lib/commandLogger');
const { checkCooldown } = require('../../lib/cooldowns');
const { createNoticeEmbed } = require('../../lib/embeds');
const { formatMessage } = require('../../lib/format');
const { logger } = require('../../lib/logger');
const { getPrefixes, parsePrefixCommand } = require('../../lib/prefix');

const log = logger.child('PrefixCommands');

const NOTICE_COOLDOWN_MS = 5_000;

async function sendNotice(message, client, text) {
	if (client.cooldowns.consume('prefix-notice', message.author.id, NOTICE_COOLDOWN_MS) > 0) return;
	try {
		await message.reply({ embeds: [createNoticeEmbed(text)] });
	} catch (error) {
		log.error(`Could not reply in channel ${message.channelId}:`, error);
	}
}

module.exports = {
	name: Events.MessageCreate,
	async execute(message, client) {
		if (message.author.bot || message.webhookId || message.system || !message.inGuild()) return;

		const parsed = parsePrefixCommand(message.content, getPrefixes(client));
		if (!parsed) return;

		const { config } = client;
		const { messages } = config;
		const command = client.getPrefixCommand(parsed.name);

		if (!command) {
			// Don't answer normal chat like "??" or "@Bot thanks", only things that look like a command.
			const looksLikeCommand = parsed.prefix === config.prefix && /^[\p{L}\p{N}_-]+$/u.test(parsed.name);
			if (config.commands.replyToUnknownCommands && looksLikeCommand) {
				await sendNotice(message, client, formatMessage(messages.unknownCommand, { prefix: config.prefix }));
			}
			return;
		}

		if (command.developerOnly && !client.isDeveloper(message.author.id)) {
			await sendNotice(message, client, messages.developerOnly);
			return;
		}

		if (command.permissions) {
			// permissionsIn() also counts the channel's own permission settings.
			const missing =
				message.member?.permissionsIn(message.channel).missing(command.permissions) ??
				new PermissionsBitField(command.permissions).toArray();
			if (missing.length > 0) {
				await sendNotice(
					message,
					client,
					formatMessage(messages.noPermission, { permissions: missing.join(', ') }),
				);
				return;
			}
		}

		if (command.args && parsed.args.length === 0) {
			const usage = `${config.prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}`;
			await sendNotice(message, client, formatMessage(messages.missingArgs, { usage }));
			return;
		}

		const cooldownMessage = checkCooldown(client, `prefix:${command.name}`, message.author.id, command.cooldown);
		if (cooldownMessage) {
			await sendNotice(message, client, cooldownMessage);
			return;
		}

		// Not awaited, so logging never slows the command down.
		logCommandUsage(client, {
			type: 'prefix',
			command: message.content,
			user: message.author,
			guild: message.guild,
		});

		try {
			await command.execute(message, client, parsed.args);
		} catch (error) {
			log.error(`Error while running ${config.prefix}${command.name} (${command.filePath}):`, error);
			await sendNotice(message, client, messages.error);
		}
	},
};
