'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { createEmbed } = require('../../../lib/embeds');

/** @type {import('../../../types').SlashCommand} */
module.exports = {
	data: new SlashCommandBuilder().setName('ping').setDescription('Check how fast the bot is responding.'),
	cooldown: 5,

	async execute(interaction, client) {
		const response = await interaction.reply({ content: 'Pinging...', withResponse: true });
		const repliedAt = response.resource?.message?.createdTimestamp ?? Date.now();
		const roundTrip = repliedAt - interaction.createdTimestamp;
		const websocket = client.ws.ping >= 0 ? `${Math.round(client.ws.ping)}ms` : 'measuring...';

		const embed = createEmbed(client)
			.setTitle('🏓 Pong!')
			.addFields(
				{ name: 'Round trip', value: `\`${roundTrip}ms\``, inline: true },
				{ name: 'WebSocket', value: `\`${websocket}\``, inline: true },
			);

		await interaction.editReply({ content: '', embeds: [embed] });
	},
};
