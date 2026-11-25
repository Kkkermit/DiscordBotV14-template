'use strict';

const { EmbedBuilder, codeBlock } = require('discord.js');
const { escapeCodeBlock, truncate } = require('./format');
const { logger } = require('./logger');

const log = logger.child('Commands');

/** Channel IDs that failed once, so a misconfigured channel only produces one warning. */
const failedChannels = new Set();

/**
 * @typedef {object} CommandUsage
 * @property {'slash' | 'prefix'} type
 * @property {string} command What the user ran, e.g. `/ping` or `?help ping`.
 * @property {import('discord.js').User} user
 * @property {import('discord.js').Guild | null} guild
 */

/**
 * Logs a command use to the console and, if `config.logging.commandLogChannelId` is set, to that channel.
 * Never throws; failures are logged instead so they can't break the command itself.
 *
 * @param {import('../client').BotClient} client
 * @param {CommandUsage} usage
 */
async function logCommandUsage(client, { type, command, user, guild }) {
	const location = guild ? `${guild.name} (${guild.id})` : 'Direct Messages';
	log.info(`${user.tag} (${user.id}) used ${type} command "${truncate(command, 200)}" in ${location}.`);

	const channelId = client.config.logging.commandLogChannelId;
	if (!channelId || failedChannels.has(channelId)) return;

	try {
		const channel = await client.channels.fetch(channelId);
		if (!channel?.isSendable()) throw new Error('the channel is not a text channel the bot can send messages in');

		const embed = new EmbedBuilder()
			.setColor(client.config.embedColor)
			.setAuthor({ name: `${user.tag} used a ${type} command`, iconURL: user.displayAvatarURL() })
			.addFields(
				{ name: 'Command', value: codeBlock(escapeCodeBlock(truncate(command, 1000))) },
				{ name: 'User', value: `${user} (\`${user.id}\`)`, inline: true },
				{ name: 'Server', value: guild ? `${guild.name} (\`${guild.id}\`)` : 'Direct Messages', inline: true },
			)
			.setTimestamp();

		await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
	} catch (error) {
		failedChannels.add(channelId);
		log.warn(
			`Could not send command logs to channel ${channelId}: ${error?.message ?? error}. ` +
				'Check logging.commandLogChannelId in src/config.js and the bot permissions. Channel logging is paused until restart.',
		);
	}
}

module.exports = { logCommandUsage };
