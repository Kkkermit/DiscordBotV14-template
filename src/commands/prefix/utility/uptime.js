'use strict';

const { time, TimestampStyles } = require('discord.js');
const { createEmbed } = require('../../../lib/embeds');
const { formatDuration } = require('../../../lib/format');

/** @type {import('../../../types').PrefixCommand} */
module.exports = {
	name: 'uptime',
	description: 'Show how long the bot has been online.',
	aliases: ['botuptime'],

	async execute(message, client) {
		const embed = createEmbed(client)
			.setTitle('⏳ Uptime')
			.setThumbnail(client.user.displayAvatarURL())
			.addFields(
				{ name: 'Uptime', value: `\`${formatDuration(client.uptime)}\``, inline: true },
				{ name: 'Online since', value: time(client.readyAt, TimestampStyles.FullDateShortTime), inline: true },
			);

		await message.reply({ embeds: [embed] });
	},
};
