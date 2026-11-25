'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { collectRefreshClicks, createBotInfoPayload } = require('../../../lib/botInfo');

/** @type {import('../../../types').SlashCommand} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('bot-info')
		.setDescription('Show information and statistics about the bot.'),
	cooldown: 10,

	async execute(interaction, client) {
		const response = await interaction.reply({ ...createBotInfoPayload(client), withResponse: true });
		const message = response.resource?.message;
		if (!message) return;

		collectRefreshClicks({
			message,
			userId: interaction.user.id,
			client,
			edit: (payload) => interaction.editReply(payload),
		});
	},
};
