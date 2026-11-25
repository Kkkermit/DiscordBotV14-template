'use strict';

const { ApplicationCommandType, PermissionsBitField, chatInputApplicationCommandMention } = require('discord.js');
const { createEmbed } = require('./embeds');
const { truncate } = require('./format');

const MAX_FIELDS = 25;
const MAX_FIELD_LENGTH = 1024;

/**
 * Groups commands by category for display, sorted alphabetically.
 *
 * @template {{ category: string }} T
 * @param {Iterable<T>} commands
 * @returns {[string, T[]][]}
 */
function groupByCategory(commands) {
	return Object.entries(Object.groupBy(commands, ({ category }) => category)).sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Formats a slash command for display. Uses a clickable mention when Discord has given the command an ID.
 *
 * @param {import('../client').BotClient} client
 * @param {import('../handlers/commandHandler').LoadedSlashCommand} command
 * @returns {string}
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
 * @param {import('../client').BotClient} client
 * @param {string} userId
 * @returns {import('../handlers/commandHandler').LoadedSlashCommand[]} Commands the user is allowed to see.
 */
function getVisibleSlashCommands(client, userId) {
	return [...client.slashCommands.values()].filter((command) => !command.developerOnly || client.isDeveloper(userId));
}

/**
 * @param {import('../client').BotClient} client
 * @param {string} userId
 * @returns {import('../handlers/commandHandler').LoadedPrefixCommand[]} Commands the user is allowed to see.
 */
function getVisiblePrefixCommands(client, userId) {
	return [...client.prefixCommands.values()].filter(
		(command) => !command.developerOnly || client.isDeveloper(userId),
	);
}

/**
 * Lists every slash command the user can use, grouped by category.
 *
 * @param {import('../client').BotClient} client
 * @param {string} userId
 */
function createSlashHelpEmbed(client, userId) {
	const fields = groupByCategory(getVisibleSlashCommands(client, userId))
		.slice(0, MAX_FIELDS)
		.map(([category, commands]) => ({
			name: category,
			value: truncate(
				commands
					.map((command) => {
						const description = command.data.description ? ` - ${command.data.description}` : '';
						return `${formatSlashCommandName(client, command)}${description}`;
					})
					.join('\n'),
				MAX_FIELD_LENGTH,
			),
		}));

	return createEmbed(client)
		.setTitle(`${client.user.username} commands`)
		.setDescription(
			[
				'Use `/help command:<name>` to learn more about a command.',
				`Prefer typing? Use \`${client.config.prefix}help\` to see the prefix commands.`,
			].join('\n'),
		)
		.addFields(fields.length > 0 ? fields : [{ name: 'No commands', value: 'There are no commands yet.' }]);
}

/**
 * Shows the details of a single slash command.
 *
 * @param {import('../client').BotClient} client
 * @param {import('../handlers/commandHandler').LoadedSlashCommand} command
 */
function createSlashCommandEmbed(client, command) {
	const json = command.data.toJSON();
	const options = (json.options ?? [])
		.map((option) => `\`${option.name}\`${option.required ? ' (required)' : ''} - ${option.description}`)
		.join('\n');
	const cooldown = command.cooldown ?? client.config.commands.defaultCooldownSeconds;

	return createEmbed(client)
		.setTitle(`Command: ${json.name}`)
		.setDescription(json.description || 'No description.')
		.addFields(
			{ name: 'Usage', value: formatSlashCommandName(client, command), inline: true },
			{ name: 'Category', value: command.category, inline: true },
			{ name: 'Cooldown', value: cooldown > 0 ? `${cooldown}s` : 'None', inline: true },
			...(options ? [{ name: 'Options', value: truncate(options, MAX_FIELD_LENGTH) }] : []),
		);
}

/**
 * Lists every prefix command the user can use, grouped by category.
 *
 * @param {import('../client').BotClient} client
 * @param {string} userId
 */
function createPrefixHelpEmbed(client, userId) {
	const { prefix } = client.config;
	const fields = groupByCategory(getVisiblePrefixCommands(client, userId))
		.slice(0, MAX_FIELDS)
		.map(([category, commands]) => ({
			name: category,
			value: truncate(
				commands
					.map(
						(command) =>
							`\`${prefix}${command.name}\`${command.description ? ` - ${command.description}` : ''}`,
					)
					.join('\n'),
				MAX_FIELD_LENGTH,
			),
		}));

	return createEmbed(client)
		.setTitle(`${client.user.username} prefix commands`)
		.setDescription(
			[
				`My prefix is \`${prefix}\`. Use \`${prefix}help <command>\` to learn more about a command.`,
				'Slash commands are listed with `/help`.',
			].join('\n'),
		)
		.addFields(fields.length > 0 ? fields : [{ name: 'No commands', value: 'There are no commands yet.' }]);
}

/**
 * Shows the details of a single prefix command.
 *
 * @param {import('../client').BotClient} client
 * @param {import('../handlers/commandHandler').LoadedPrefixCommand} command
 */
function createPrefixCommandEmbed(client, command) {
	const { prefix } = client.config;
	const cooldown = command.cooldown ?? client.config.commands.defaultCooldownSeconds;
	const usage = `${prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}`;
	const permissions = command.permissions ? new PermissionsBitField(command.permissions).toArray() : [];

	return createEmbed(client)
		.setTitle(`Command: ${command.name}`)
		.setDescription(command.description ?? 'No description.')
		.addFields(
			{ name: 'Usage', value: `\`${usage}\``, inline: true },
			{ name: 'Category', value: command.category, inline: true },
			{ name: 'Cooldown', value: cooldown > 0 ? `${cooldown}s` : 'None', inline: true },
			{
				name: 'Aliases',
				value: command.aliases?.length ? command.aliases.map((a) => `\`${a}\``).join(', ') : 'None',
			},
			...(permissions.length > 0 ? [{ name: 'Required permissions', value: permissions.join(', ') }] : []),
		);
}

module.exports = {
	getVisibleSlashCommands,
	getVisiblePrefixCommands,
	createSlashHelpEmbed,
	createSlashCommandEmbed,
	createPrefixHelpEmbed,
	createPrefixCommandEmbed,
};
