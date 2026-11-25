'use strict';

const { Events } = require('discord.js');
const { createEmbed } = require('../../lib/embeds');

/** @type {import('../../types').BotEvent} */
module.exports = {
	name: Events.MessageCreate,
	/**
	 * Introduces the bot when a message contains nothing but a mention of it.
	 * This is a second `messageCreate` listener, showing that several events can share a name.
	 *
	 * @param {import('discord.js').Message} message
	 * @param {import('../../client').BotClient} client
	 */
	async execute(message, client) {
		if (message.author.bot || !message.inGuild()) return;

		const mention = new RegExp(`^<@!?${client.user.id}>$`);
		if (!mention.test(message.content.trim())) return;

		const embed = createEmbed(client)
			.setTitle(`Hey ${message.author.displayName}, I'm ${client.user.username}!`)
			.setThumbnail(client.user.displayAvatarURL())
			.setDescription(
				[
					'Use `/help` to see my slash commands.',
					`My prefix is \`${client.config.prefix}\`, use \`${client.config.prefix}help\` to see my prefix commands.`,
				].join('\n'),
			);

		await message.reply({ embeds: [embed] });
	},
};
