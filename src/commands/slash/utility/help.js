const { MessageFlags, SlashCommandBuilder } = require('discord.js');
const { createSlashCommandEmbed, createSlashHelpEmbed, getVisibleCommands } = require('../../../lib/help');

const MAX_SUGGESTIONS = 25;

/** @type {import('../../../types').SlashCommand} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('List all commands, or get details about one.')
		.addStringOption((option) =>
			option
				.setName('command')
				.setDescription('The command to get details about.')
				.setAutocomplete(true)
				.setRequired(false),
		),

	// Suggests command names while the user types (because of `.setAutocomplete(true)` above).
	async autocomplete(interaction, client) {
		const query = interaction.options.getFocused().toLowerCase();
		const suggestions = getVisibleCommands(client, interaction.user.id, client.slashCommands)
			.map((command) => command.data.name)
			// Context menu commands can have capital letters, so compare in lower case.
			.filter((name) => name.toLowerCase().includes(query))
			.sort((a, b) => a.localeCompare(b))
			.slice(0, MAX_SUGGESTIONS)
			.map((name) => ({ name, value: name }));

		await interaction.respond(suggestions);
	},

	async execute(interaction, client) {
		const name = interaction.options.getString('command')?.toLowerCase();
		if (!name) {
			await interaction.reply({ embeds: [createSlashHelpEmbed(client, interaction.user.id)] });
			return;
		}

		const command = getVisibleCommands(client, interaction.user.id, client.slashCommands).find(
			({ data }) => data.name.toLowerCase() === name,
		);
		if (!command) {
			await interaction.reply({
				content: `There is no command called \`${name.replaceAll('`', '')}\`. Use \`/help\` to see every command.`,
				flags: MessageFlags.Ephemeral,
				allowedMentions: { parse: [] },
			});
			return;
		}

		await interaction.reply({ embeds: [createSlashCommandEmbed(client, command)] });
	},
};
