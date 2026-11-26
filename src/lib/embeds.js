const { EmbedBuilder } = require('discord.js');

/**
 * Creates an embed pre-filled with the configured colour and a developer footer.
 *
 * @param {import('../client').BotClient} client
 * @returns {EmbedBuilder}
 */
function createEmbed(client) {
	return new EmbedBuilder()
		.setColor(client.config.embedColor)
		.setFooter({ text: `${client.user.username} • Developed by ${client.config.developerName}` });
}

/**
 * Creates a short coloured embed for errors and notices.
 *
 * @param {string} description
 * @param {import('discord.js').ColorResolvable} [color]
 * @returns {EmbedBuilder}
 */
function createNoticeEmbed(description, color = 'Red') {
	return new EmbedBuilder().setColor(color).setDescription(description);
}

module.exports = { createEmbed, createNoticeEmbed };
