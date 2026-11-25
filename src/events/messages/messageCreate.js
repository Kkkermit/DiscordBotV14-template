'use strict';

const { Events, PermissionsBitField, time, TimestampStyles } = require('discord.js');
const { logCommandUsage } = require('../../lib/commandLogger');
const { createNoticeEmbed } = require('../../lib/embeds');
const { formatMessage } = require('../../lib/format');
const { logger } = require('../../lib/logger');
const { getPrefixes, parsePrefixCommand } = require('../../lib/prefix');

const log = logger.child('PrefixCommands');

/**
 * Replies with a notice, logging (instead of throwing) if the message can't be sent.
 *
 * @param {import('discord.js').Message} message
 * @param {string} text
 */
async function sendNotice(message, text) {
	try {
		await message.reply({ embeds: [createNoticeEmbed(text)] });
	} catch (error) {
		log.error(`Could not reply in channel ${message.channelId}:`, error);
	}
}

/** @type {import('../../types').BotEvent} */
module.exports = {
	name: Events.MessageCreate,
	/**
	 * Parses prefix commands and runs them after checking developer-only, permissions, arguments and cooldowns.
	 *
	 * @param {import('discord.js').Message} message
	 * @param {import('../../client').BotClient} client
	 */
	async execute(message, client) {
		if (message.author.bot || message.webhookId || message.system || !message.inGuild()) return;

		const parsed = parsePrefixCommand(message.content, getPrefixes(client));
		if (!parsed) return;

		const { config } = client;
		const { messages } = config;
		const command = client.getPrefixCommand(parsed.name);

		if (!command) {
			// Only hint for the text prefix: people often mention the bot just to talk to it.
			if (config.commands.replyToUnknownCommands && parsed.prefix === config.prefix) {
				await sendNotice(message, formatMessage(messages.unknownCommand, { prefix: config.prefix }));
			}
			return;
		}

		if (command.developerOnly && !client.isDeveloper(message.author.id)) {
			await sendNotice(message, messages.developerOnly);
			return;
		}

		if (command.permissions) {
			const missing =
				message.member?.permissions.missing(command.permissions) ??
				new PermissionsBitField(command.permissions).toArray();
			if (missing.length > 0) {
				await sendNotice(message, formatMessage(messages.noPermission, { permissions: missing.join(', ') }));
				return;
			}
		}

		if (command.args && parsed.args.length === 0) {
			const usage = `${config.prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}`;
			await sendNotice(message, formatMessage(messages.missingArgs, { usage }));
			return;
		}

		const cooldownSeconds = command.cooldown ?? config.commands.defaultCooldownSeconds;
		const remainingMs = client.cooldowns.consume(
			`prefix:${command.name}`,
			message.author.id,
			cooldownSeconds * 1000,
		);
		if (remainingMs > 0) {
			const availableAt = new Date(Date.now() + remainingMs);
			await sendNotice(
				message,
				formatMessage(messages.cooldown, { time: time(availableAt, TimestampStyles.RelativeTime) }),
			);
			return;
		}

		void logCommandUsage(client, {
			type: 'prefix',
			command: message.content,
			user: message.author,
			guild: message.guild,
		});

		try {
			await command.execute(message, client, parsed.args);
		} catch (error) {
			log.error(`Error while running ${config.prefix}${command.name} (${command.filePath}):`, error);
			await sendNotice(message, messages.error);
		}
	},
};
