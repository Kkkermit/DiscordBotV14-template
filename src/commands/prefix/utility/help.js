const { createPrefixCommandEmbed, createPrefixHelpEmbed } = require('../../../lib/help');

/** @type {import('../../../types').PrefixCommand} */
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
				// The name is typed by the user: remove backticks so it can't break out of the code style.
				content: `There is no command called \`${name.replaceAll('`', '')}\`. Use \`${client.config.prefix}help\` to see every command.`,
				allowedMentions: { parse: [] },
			});
			return;
		}

		await message.reply({ embeds: [createPrefixCommandEmbed(client, command)] });
	},
};
