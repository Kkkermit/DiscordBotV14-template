const { Events } = require('discord.js');
const { createEmbed } = require('../../lib/embeds');

module.exports = {
	name: Events.MessageCreate,
	async execute(message, client) {
		if (message.author.bot || !message.inGuild()) return;

		// Only reply when the whole message is a mention of the bot.
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
