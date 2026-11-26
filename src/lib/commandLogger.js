const { DiscordAPIError, EmbedBuilder, codeBlock } = require('discord.js');
const { escapeCodeBlock, truncate } = require('./format');
const { logger } = require('./logger');

const log = logger.child('Commands');

// Channels Discord refused. They're skipped until the bot restarts, so you only get one warning.
const failedChannels = new Set();

function disableChannel(channelId, reason) {
	failedChannels.add(channelId);
	log.warn(
		`Command logs can't be sent to channel ${channelId}: ${reason}. Check logging.commandLogChannelId in ` +
			'src/config.js and the bot permissions in that channel. Channel logging is paused until restart.',
	);
}

async function logCommandUsage(client, { type, command, user, guild }) {
	const location = guild ? `${guild.name} (${guild.id})` : 'Direct Messages';
	log.info(`${user.tag} (${user.id}) used ${type} command "${truncate(command, 200)}" in ${location}.`);

	const channelId = client.config.logging.commandLogChannelId;
	if (!channelId || failedChannels.has(channelId)) return;

	const embed = new EmbedBuilder()
		.setColor(client.config.embedColor)
		.setAuthor({ name: `${user.tag} used a ${type} command`, iconURL: user.displayAvatarURL() })
		.addFields(
			// Escape first, then shorten, so the field always stays under Discord's 1024 character limit.
			{ name: 'Command', value: codeBlock(truncate(escapeCodeBlock(command), 1000)) },
			{ name: 'User', value: `${user} (\`${user.id}\`)`, inline: true },
			{ name: 'Server', value: guild ? `${guild.name} (\`${guild.id}\`)` : 'Direct Messages', inline: true },
		)
		.setTimestamp();

	try {
		const channel = await client.channels.fetch(channelId);
		if (!channel?.isSendable()) {
			disableChannel(channelId, 'it is not a text channel the bot can send messages in');
			return;
		}
		await channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
	} catch (error) {
		// Unknown channel or missing access/permissions won't fix themselves; network hiccups might.
		if (error instanceof DiscordAPIError) disableChannel(channelId, error.message);
		else log.warn(`Could not send a command log to channel ${channelId}:`, error);
	}
}

module.exports = { logCommandUsage };
