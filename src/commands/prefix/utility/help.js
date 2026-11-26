const { truncate } = require('../../../lib/format');
const { createPrefixCommandEmbed, createPrefixHelpEmbed } = require('../../../lib/help');

module.exports = {
	name: 'help',
	description: 'List all prefix commands, or get details about one.',
	aliases: ['h', 'commands'],
	usage: '[command]',

	async execute(message, client, args) {
		const [name] = args;
		if (!name) {
			await message.reply({ embeds: [createPrefixHelpEmbed(client, message.author.id)] });
			return;
		}

		const command = client.getPrefixCommand(name);
		if (!command || (command.developerOnly && !client.isDeveloper(message.author.id))) {
			await message.reply({
				// The name is typed by the user: shorten it and remove backticks so it can't break the formatting.
				content: `There is no command called \`${truncate(name.replaceAll('`', ''), 100)}\`. Use \`${client.config.prefix}help\` to see every command.`,
				allowedMentions: { parse: [] },
			});
			return;
		}

		await message.reply({ embeds: [createPrefixCommandEmbed(client, command)] });
	},
};
