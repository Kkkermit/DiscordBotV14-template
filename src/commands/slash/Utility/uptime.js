'use strict';

const { SlashCommandBuilder, time, TimestampStyles } = require('discord.js');
const { createEmbed } = require('../../../lib/embeds');
const { formatDuration } = require('../../../lib/format');

/** @type {import('../../../types').SlashCommand} */
module.exports = {
	data: new SlashCommandBuilder().setName('uptime').setDescription('Show how long the bot has been online.'),

	async execute(interaction, client) {
		const onlineSince = new Date(Date.now() - client.uptime);

		const embed = createEmbed(client)
			.setTitle('⏳ Uptime')
			.setThumbnail(client.user.displayAvatarURL())
			.addFields(
				{ name: 'Uptime', value: `\`${formatDuration(client.uptime)}\``, inline: true },
				{ name: 'Online since', value: time(onlineSince, TimestampStyles.LongDateTime), inline: true },
			);

		await interaction.reply({ embeds: [embed] });
	},
};
