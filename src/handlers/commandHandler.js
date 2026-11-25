'use strict';

const path = require('node:path');
const { Collection, PermissionsBitField } = require('discord.js');
const { findJsFiles, getCategory } = require('../lib/files');
const { logger } = require('../lib/logger');

const log = logger.child('Commands');

const SLASH_COMMANDS_DIR = path.join(__dirname, '..', 'commands', 'slash');
const PREFIX_COMMANDS_DIR = path.join(__dirname, '..', 'commands', 'prefix');

/**
 * @typedef {import('../types').SlashCommand & { category: string, filePath: string }} LoadedSlashCommand
 * @typedef {import('../types').PrefixCommand & { category: string, filePath: string }} LoadedPrefixCommand
 * @typedef {{ file: string, reason: string, error?: unknown }} LoadFailure
 */

const isFunction = (value) => typeof value === 'function';
const isSingleWord = (value) => typeof value === 'string' && /^\S+$/.test(value);

/**
 * Returns why the shared optional command properties are invalid, or `null` if they are fine.
 *
 * @param {Record<string, unknown>} command
 * @returns {string | null}
 */
function validateSharedOptions(command) {
	if (command.cooldown !== undefined && !(Number.isFinite(command.cooldown) && command.cooldown >= 0)) {
		return '"cooldown" must be a number of seconds (0 or more).';
	}
	if (command.developerOnly !== undefined && typeof command.developerOnly !== 'boolean') {
		return '"developerOnly" must be true or false.';
	}
	return null;
}

/**
 * Checks that a module exports a valid slash (or context menu) command.
 *
 * @param {unknown} command
 * @returns {string | null} The reason it is invalid, or `null` if it is valid.
 */
function validateSlashCommand(command) {
	if (!command || typeof command !== 'object') return 'the file does not export a command object.';
	if (!command.data || typeof command.data.name !== 'string' || !isFunction(command.data.toJSON)) {
		return 'missing a "data" property built with SlashCommandBuilder or ContextMenuCommandBuilder.';
	}
	if (!isFunction(command.execute)) return 'missing an "execute" function.';
	if (command.autocomplete !== undefined && !isFunction(command.autocomplete)) {
		return '"autocomplete" must be a function.';
	}
	return validateSharedOptions(command);
}

/**
 * Checks that a module exports a valid prefix command.
 *
 * @param {unknown} command
 * @returns {string | null} The reason it is invalid, or `null` if it is valid.
 */
function validatePrefixCommand(command) {
	if (!command || typeof command !== 'object') return 'the file does not export a command object.';
	if (!isSingleWord(command.name)) return 'missing a "name" (a single word without spaces).';
	if (!isFunction(command.execute)) return 'missing an "execute" function.';
	if (command.aliases !== undefined && !(Array.isArray(command.aliases) && command.aliases.every(isSingleWord))) {
		return '"aliases" must be an array of single words.';
	}
	if (command.args !== undefined && typeof command.args !== 'boolean') return '"args" must be true or false.';
	if (command.permissions !== undefined) {
		try {
			PermissionsBitField.resolve(command.permissions);
		} catch {
			return '"permissions" must be a list of permission flags, e.g. [PermissionFlagsBits.ManageMessages].';
		}
	}
	return validateSharedOptions(command);
}

/**
 * Loads every slash command from a directory. Invalid files are reported instead of crashing the bot.
 *
 * @param {string} [directory]
 * @returns {{ commands: Collection<string, LoadedSlashCommand>, failures: LoadFailure[] }}
 */
function loadSlashCommands(directory = SLASH_COMMANDS_DIR) {
	/** @type {Collection<string, LoadedSlashCommand>} */
	const commands = new Collection();
	/** @type {LoadFailure[]} */
	const failures = [];

	for (const file of findJsFiles(directory)) {
		const relativePath = path.relative(directory, file);
		try {
			const command = require(file);
			const problem = validateSlashCommand(command);
			if (problem) {
				failures.push({ file: relativePath, reason: problem });
				continue;
			}

			// Builders validate their options lazily, so serialise now to surface mistakes with the file name.
			command.data.toJSON();

			const { name } = command.data;
			if (commands.has(name)) {
				failures.push({
					file: relativePath,
					reason: `"${name}" is already defined in ${commands.get(name).filePath}.`,
				});
				continue;
			}

			commands.set(name, { ...command, category: getCategory(directory, file), filePath: relativePath });
		} catch (error) {
			failures.push({ file: relativePath, reason: error?.message ?? String(error), error });
		}
	}

	return { commands, failures };
}

/**
 * Loads every prefix command from a directory and builds the alias lookup table.
 * Command names always win over aliases; conflicting aliases are skipped with a warning.
 *
 * @param {string} [directory]
 * @returns {{ commands: Collection<string, LoadedPrefixCommand>, aliases: Collection<string, string>, failures: LoadFailure[], warnings: string[] }}
 */
function loadPrefixCommands(directory = PREFIX_COMMANDS_DIR) {
	/** @type {Collection<string, LoadedPrefixCommand>} */
	const commands = new Collection();
	/** @type {Collection<string, string>} */
	const aliases = new Collection();
	/** @type {LoadFailure[]} */
	const failures = [];
	/** @type {string[]} */
	const warnings = [];

	for (const file of findJsFiles(directory)) {
		const relativePath = path.relative(directory, file);
		try {
			const command = require(file);
			const problem = validatePrefixCommand(command);
			if (problem) {
				failures.push({ file: relativePath, reason: problem });
				continue;
			}

			const name = command.name.toLowerCase();
			if (commands.has(name)) {
				failures.push({
					file: relativePath,
					reason: `"${name}" is already defined in ${commands.get(name).filePath}.`,
				});
				continue;
			}

			commands.set(name, { ...command, name, category: getCategory(directory, file), filePath: relativePath });
		} catch (error) {
			failures.push({ file: relativePath, reason: error?.message ?? String(error), error });
		}
	}

	// Register aliases after every name is known so a name always takes priority over an alias.
	for (const command of commands.values()) {
		for (const rawAlias of command.aliases ?? []) {
			const alias = rawAlias.toLowerCase();
			if (commands.has(alias)) {
				warnings.push(`Alias "${alias}" of "${command.name}" is skipped because a command has that name.`);
			} else if (aliases.has(alias)) {
				warnings.push(
					`Alias "${alias}" of "${command.name}" is skipped because "${aliases.get(alias)}" uses it.`,
				);
			} else {
				aliases.set(alias, command.name);
			}
		}
	}

	return { commands, aliases, failures, warnings };
}

/**
 * Prints the load result of a command type.
 *
 * @param {string} type
 * @param {Collection<string, { category: string }>} commands
 * @param {LoadFailure[]} failures
 */
function reportLoadResult(type, commands, failures) {
	for (const { file, reason, error } of failures) {
		// Thrown errors (syntax errors, bad builder options...) are printed in full so the stack shows the line.
		if (error) log.error(`Skipped ${type} command ${file}:`, error);
		else log.error(`Skipped ${type} command ${file}: ${reason}`);
	}

	const byCategory = Object.entries(Object.groupBy(commands.values(), ({ category }) => category))
		.map(([category, list]) => `${category}: ${list.length}`)
		.join(', ');
	log.success(`Loaded ${commands.size} ${type} command(s)${byCategory ? ` (${byCategory})` : ''}.`);
}

/**
 * Loads slash and prefix commands onto the client.
 *
 * @param {import('../client').BotClient} client
 */
function loadCommands(client) {
	const slash = loadSlashCommands();
	client.slashCommands = slash.commands;
	reportLoadResult('slash', slash.commands, slash.failures);

	const prefix = loadPrefixCommands();
	client.prefixCommands = prefix.commands;
	client.prefixAliases = prefix.aliases;
	for (const warning of prefix.warnings) log.warn(warning);
	reportLoadResult('prefix', prefix.commands, prefix.failures);
}

module.exports = {
	SLASH_COMMANDS_DIR,
	PREFIX_COMMANDS_DIR,
	validateSlashCommand,
	validatePrefixCommand,
	loadSlashCommands,
	loadPrefixCommands,
	loadCommands,
};
