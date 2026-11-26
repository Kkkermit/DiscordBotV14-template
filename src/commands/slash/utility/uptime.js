const { SlashCommandBuilder, time, TimestampStyles } = require('discord.js');
const { createEmbed } = require('../../../lib/embeds');
const { formatDuration } = require('../../../lib/format');

module.exports = {
	data: new SlashCommandBuilder().setName('uptime').setDescription('Show how long the bot has been online.'),

	async execute(interaction, client) {
		const embed = createEmbed(client)
			.setTitle('⏳ Uptime')
			.setThumbnail(client.user.displayAvatarURL())
			.addFields(
				{ name: 'Uptime', value: `\`${formatDuration(client.uptime)}\``, inline: true },
				{ name: 'Online since', value: time(client.readyAt, TimestampStyles.FullDateShortTime), inline: true },
			);

		await interaction.reply({ embeds: [embed] });
	},
};
