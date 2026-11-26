const { ApplicationCommandType, PermissionsBitField, chatInputApplicationCommandMention } = require('discord.js');
const { createEmbed } = require('./embeds');
const { joinLines, truncate } = require('./format');

// Discord limits an embed to 25 fields of 1024 characters, and 6000 characters in total.
const MAX_FIELDS = 25;
const MAX_FIELD_LENGTH = 1024;
const COMMAND_LIST_BUDGET = 4500;

function categoryFields(commands, formatLine) {
	const categories = Object.entries(Object.groupBy(commands, (command) => command.category))
		.sort(([a], [b]) => a.localeCompare(b))
		.slice(0, MAX_FIELDS);
	if (categories.length === 0) return [{ name: 'No commands', value: 'There are no commands yet.' }];

	// Each category gets an equal share, so the whole embed stays under Discord's limit.
	const maxLength = Math.min(MAX_FIELD_LENGTH, Math.floor(COMMAND_LIST_BUDGET / categories.length));
	return categories.map(([category, list]) => ({
		name: category,
		value: joinLines(list.map(formatLine), maxLength),
	}));
}

const withDescription = (text) => (text ? ` - ${text}` : '');

function formatCooldown(client, cooldown) {
	const seconds = cooldown ?? client.config.commands.defaultCooldownSeconds;
	return seconds > 0 ? `${seconds}s` : 'None';
}

function formatSlashCommandName(client, command) {
	const { name, type } = command.data.toJSON();
	if (type === ApplicationCommandType.User || type === ApplicationCommandType.Message) {
		return `\`${name}\` (right-click menu)`;
	}
	// Filled in by `commands.set()` when the bot registers its commands on startup.
	const registered = client.application?.commands.cache.find(
		(command) => command.name === name && command.type === ApplicationCommandType.ChatInput,
	);
	return registered ? chatInputApplicationCommandMention(name, registered.id) : `\`/${name}\``;
}

function getVisibleCommands(client, userId, commands) {
	return [...commands.values()].filter((command) => !command.developerOnly || client.isDeveloper(userId));
}

function createSlashHelpEmbed(client, userId) {
	const fields = categoryFields(
		getVisibleCommands(client, userId, client.slashCommands),
		(command) => `${formatSlashCommandName(client, command)}${withDescription(command.data.description)}`,
	);

	return createEmbed(client)
		.setTitle(`${client.user.username} commands`)
		.setDescription(
			'Use `/help command:<name>` to learn more about a command.\n' +
				`Prefer typing? Use \`${client.config.prefix}help\` to see the prefix commands.`,
		)
		.addFields(fields);
}

function createSlashCommandEmbed(client, command) {
	const json = command.data.toJSON();
	const options = (json.options ?? [])
		.map((option) => `\`${option.name}\`${option.required ? ' (required)' : ''} - ${option.description}`)
		.join('\n');

	return createEmbed(client)
		.setTitle(`Command: ${json.name}`)
		.setDescription(json.description || 'No description.')
		.addFields(
			{ name: 'Usage', value: formatSlashCommandName(client, command), inline: true },
			{ name: 'Category', value: command.category, inline: true },
			{ name: 'Cooldown', value: formatCooldown(client, command.cooldown), inline: true },
			...(options ? [{ name: 'Options', value: truncate(options, MAX_FIELD_LENGTH) }] : []),
		);
}

function createPrefixHelpEmbed(client, userId) {
	const { prefix } = client.config;
	const fields = categoryFields(
		getVisibleCommands(client, userId, client.prefixCommands),
		(command) => `\`${prefix}${command.name}\`${withDescription(command.description)}`,
	);

	return createEmbed(client)
		.setTitle(`${client.user.username} prefix commands`)
		.setDescription(
			`My prefix is \`${prefix}\`. Use \`${prefix}help <command>\` to learn more about a command.\n` +
				'Slash commands are listed with `/help`.',
		)
		.addFields(fields);
}

function createPrefixCommandEmbed(client, command) {
	const usage = truncate(`${client.config.prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}`, 1000);
	const aliases = truncate(command.aliases?.map((alias) => `\`${alias}\``).join(', ') ?? '', MAX_FIELD_LENGTH);
	const permissions = command.permissions ? new PermissionsBitField(command.permissions).toArray().join(', ') : '';

	return createEmbed(client)
		.setTitle(`Command: ${command.name}`)
		.setDescription(truncate(command.description || 'No description.', 4096))
		.addFields(
			{ name: 'Usage', value: `\`${usage}\``, inline: true },
			{ name: 'Category', value: command.category, inline: true },
			{ name: 'Cooldown', value: formatCooldown(client, command.cooldown), inline: true },
			{ name: 'Aliases', value: aliases || 'None' },
			...(permissions ? [{ name: 'Required permissions', value: permissions }] : []),
		);
}

module.exports = {
	getVisibleCommands,
	createSlashHelpEmbed,
	createSlashCommandEmbed,
	createPrefixHelpEmbed,
	createPrefixCommandEmbed,
};
