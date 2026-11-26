const path = require('node:path');
const { Collection, PermissionsBitField } = require('discord.js');
const { findJsFiles, getCategory } = require('../lib/files');
const { logger } = require('../lib/logger');

const log = logger.child('Commands');

const SLASH_COMMANDS_DIR = path.join(__dirname, '..', 'commands', 'slash');
const PREFIX_COMMANDS_DIR = path.join(__dirname, '..', 'commands', 'prefix');

const isLowerCaseWord = (value) => typeof value === 'string' && /^\S+$/.test(value) && value === value.toLowerCase();

// Each validator returns what is wrong with a command file's export, or `null` if it's valid.
function validateCommonOptions(command) {
	if (typeof command.execute !== 'function') return 'missing an "execute" function.';
	if (command.cooldown !== undefined && !(Number.isFinite(command.cooldown) && command.cooldown >= 0)) {
		return '"cooldown" must be a number of seconds (0 or more).';
	}
	if (command.developerOnly !== undefined && typeof command.developerOnly !== 'boolean') {
		return '"developerOnly" must be true or false.';
	}
	return null;
}

function validateSlashCommand(command) {
	if (typeof command?.data?.toJSON !== 'function') {
		return 'missing a "data" property built with SlashCommandBuilder or ContextMenuCommandBuilder.';
	}
	// Builders only check some of their options when they are converted to JSON, so do it now.
	try {
		command.data.toJSON();
	} catch (error) {
		return `invalid "data" (${error.message}). Check that the command and every option have a name and a description.`;
	}
	if (command.autocomplete !== undefined && typeof command.autocomplete !== 'function') {
		return '"autocomplete" must be a function.';
	}
	return validateCommonOptions(command);
}

function validatePrefixCommand(command) {
	if (!isLowerCaseWord(command?.name)) return 'missing a "name": a single lower case word.';
	if (command.aliases !== undefined && !(Array.isArray(command.aliases) && command.aliases.every(isLowerCaseWord))) {
		return '"aliases" must be a list of single lower case words.';
	}
	if (command.args !== undefined && typeof command.args !== 'boolean') return '"args" must be true or false.';
	if (command.permissions !== undefined) {
		try {
			PermissionsBitField.resolve(command.permissions);
		} catch {
			return '"permissions" must be a list of permission flags, e.g. [PermissionFlagsBits.ManageMessages].';
		}
	}
	return validateCommonOptions(command);
}

function loadCommandFiles(directory, validate, getName) {
	const commands = new Collection();
	const failures = [];

	for (const file of findJsFiles(directory)) {
		const filePath = path.relative(directory, file);
		try {
			const command = require(file);
			const problem = validate(command);
			if (problem) {
				failures.push({ file: filePath, reason: problem });
				continue;
			}

			const name = getName(command);
			const existing = commands.get(name);
			if (existing) {
				failures.push({
					file: filePath,
					reason: `the name "${name}" is already used by ${existing.filePath}.`,
				});
				continue;
			}

			commands.set(name, { ...command, category: getCategory(directory, file), filePath });
		} catch (error) {
			failures.push({ file: filePath, reason: error?.message ?? String(error), error });
		}
	}

	return { commands, failures };
}

function loadSlashCommands(directory = SLASH_COMMANDS_DIR) {
	return loadCommandFiles(directory, validateSlashCommand, (command) => command.data.name);
}

function loadPrefixCommands(directory = PREFIX_COMMANDS_DIR) {
	const { commands, failures } = loadCommandFiles(directory, validatePrefixCommand, (command) => command.name);
	const aliases = new Collection();
	const warnings = [];

	for (const command of commands.values()) {
		for (const alias of command.aliases ?? []) {
			const owner = commands.has(alias) ? alias : aliases.get(alias);
			if (owner) {
				warnings.push(`Skipped alias "${alias}" of "${command.name}": "${owner}" already uses it.`);
			} else {
				aliases.set(alias, command.name);
			}
		}
	}

	return { commands, aliases, failures, warnings };
}

function reportLoadResult(type, commands, failures) {
	for (const { file, reason, error } of failures) {
		// Print thrown errors in full: their stack shows the line that broke.
		if (error) log.error(`Skipped ${type} command ${file}:`, error);
		else log.error(`Skipped ${type} command ${file}: ${reason}`);
	}

	const perCategory = Object.entries(Object.groupBy(commands.values(), (command) => command.category))
		.map(([category, list]) => `${category}: ${list.length}`)
		.join(', ');
	log.success(`Loaded ${commands.size} ${type} command(s)${perCategory ? ` (${perCategory})` : ''}.`);
}

function loadCommands(client) {
	const slash = loadSlashCommands();
	client.slashCommands = slash.commands;
	client.failedSlashCommandFiles = slash.failures.map((failure) => failure.file);
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
