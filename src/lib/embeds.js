const { EmbedBuilder } = require('discord.js');

function createEmbed(client) {
	return new EmbedBuilder()
		.setColor(client.config.embedColor)
		.setFooter({ text: `${client.user.username} • Developed by ${client.config.developerName}` });
}

function createNoticeEmbed(description, color = 'Red') {
	return new EmbedBuilder().setColor(color).setDescription(description);
}

module.exports = { createEmbed, createNoticeEmbed };
