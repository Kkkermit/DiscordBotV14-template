'use strict';

const { ApplicationCommandType, PermissionsBitField, chatInputApplicationCommandMention } = require('discord.js');
const { createEmbed } = require('./embeds');
const { joinLines, truncate } = require('./format');

// Discord limits an embed to 25 fields of 1024 characters, and 6000 characters in total.
const MAX_FIELDS = 25;
const MAX_FIELD_LENGTH = 1024;
/** Characters shared by all category lists, leaving room for the title, description and footer. */
const COMMAND_LIST_BUDGET = 4500;

/**
 * Builds one embed field per category, listing its commands with `formatLine`.
 *
 * @template {{ category: string }} T
 * @param {T[]} commands
 * @param {(command: T) => string} formatLine
 */
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

/**
 * @param {import('../client').BotClient} client
 * @param {number | undefined} cooldown
 */
function formatCooldown(client, cooldown) {
	const seconds = cooldown ?? client.config.commands.defaultCooldownSeconds;
	return seconds > 0 ? `${seconds}s` : 'None';
}

/**
 * Shows a slash command as a clickable mention when Discord has given it an ID, otherwise as `/name`.
 *
 * @param {import('../client').BotClient} client
 * @param {import('../handlers/commandHandler').LoadedSlashCommand} command
 */
function formatSlashCommandName(client, command) {
	const { name, type } = command.data.toJSON();
	if (type === ApplicationCommandType.User || type === ApplicationCommandType.Message) {
		return `\`${name}\` (right-click menu)`;
	}
	const id = client.commandIds.get(name);
	return id ? chatInputApplicationCommandMention(name, id) : `\`/${name}\``;
}

/**
 * Hides developer-only commands from everyone who isn't a developer.
 *
 * @template {{ developerOnly?: boolean }} T
 * @param {import('../client').BotClient} client
 * @param {string} userId
 * @param {import('discord.js').Collection<string, T>} commands
 */
function getVisibleCommands(client, userId, commands) {
	return [...commands.values()].filter((command) => !command.developerOnly || client.isDeveloper(userId));
}

/**
 * @param {import('../client').BotClient} client
 * @param {string} userId
 */
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

/**
 * @param {import('../client').BotClient} client
 * @param {import('../handlers/commandHandler').LoadedSlashCommand} command
 */
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

/**
 * @param {import('../client').BotClient} client
 * @param {string} userId
 */
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

/**
 * @param {import('../client').BotClient} client
 * @param {import('../handlers/commandHandler').LoadedPrefixCommand} command
 */
function createPrefixCommandEmbed(client, command) {
	const usage = `${client.config.prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}`;
	const aliases = command.aliases?.map((alias) => `\`${alias}\``).join(', ');
	const permissions = command.permissions ? new PermissionsBitField(command.permissions).toArray().join(', ') : '';

	return createEmbed(client)
		.setTitle(`Command: ${command.name}`)
		.setDescription(command.description ?? 'No description.')
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
