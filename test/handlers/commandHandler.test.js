'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const {
	loadPrefixCommands,
	loadSlashCommands,
	validatePrefixCommand,
	validateSlashCommand,
} = require('../../src/handlers/commandHandler');

/**
 * Writes files into a temporary directory and returns its path.
 *
 * @param {import('node:test').TestContext} t
 * @param {Record<string, string>} files Relative path → file contents.
 */
function createFixture(t, files) {
	const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'commands-'));
	t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
	for (const [file, contents] of Object.entries(files)) {
		fs.mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
		fs.writeFileSync(path.join(directory, file), contents);
	}
	return directory;
}

const discordJsPath = JSON.stringify(require.resolve('discord.js'));
const slashCommandSource = (name) => `
const { SlashCommandBuilder } = require(${discordJsPath});
module.exports = { data: new SlashCommandBuilder().setName('${name}').setDescription('Test.'), async execute() {} };`;
const prefixCommandSource = (name, aliases = []) =>
	`module.exports = { name: '${name}', aliases: ${JSON.stringify(aliases)}, async execute() {} };`;

describe('the bundled commands', () => {
	it('all slash commands load without errors', () => {
		const { commands, failures } = loadSlashCommands();
		assert.deepEqual(failures, []);
		assert.deepEqual([...commands.keys()].sort(), ['bot-info', 'help', 'ping', 'uptime', 'user-info']);
	});

	it('all prefix commands load without errors or alias conflicts', () => {
		const { commands, aliases, failures, warnings } = loadPrefixCommands();
		assert.deepEqual(failures, []);
		assert.deepEqual(warnings, []);
		assert.deepEqual([...commands.keys()].sort(), ['bot-info', 'help', 'ping', 'uptime']);
		assert.equal(aliases.get('bi'), 'bot-info');
	});

	it('every command has a description for the help menu', () => {
		for (const command of loadPrefixCommands().commands.values()) {
			assert.ok(command.description, `${command.name} has no description`);
		}
	});
});

describe('validateSlashCommand', () => {
	const data = { name: 'test', toJSON: () => ({}) };

	it('accepts a minimal command', () => {
		assert.equal(validateSlashCommand({ data, execute() {} }), null);
	});

	it('explains what is wrong', () => {
		assert.match(validateSlashCommand(null), /"data"/);
		assert.match(validateSlashCommand({ execute() {} }), /"data"/);
		const broken = {
			name: 'x',
			toJSON: () => {
				throw new Error('Expected a string primitive');
			},
		};
		assert.match(
			validateSlashCommand({ data: broken, execute() {} }),
			/invalid "data" \(Expected a string primitive\)/,
		);
		assert.match(validateSlashCommand({ data }), /"execute"/);
		assert.match(validateSlashCommand({ data, execute() {}, cooldown: -1 }), /"cooldown"/);
		assert.match(validateSlashCommand({ data, execute() {}, autocomplete: true }), /"autocomplete"/);
		assert.match(validateSlashCommand({ data, execute() {}, developerOnly: 'yes' }), /"developerOnly"/);
	});
});

describe('validatePrefixCommand', () => {
	it('accepts a minimal command', () => {
		assert.equal(validatePrefixCommand({ name: 'test', execute() {} }), null);
	});

	it('explains what is wrong', () => {
		assert.match(validatePrefixCommand({ name: 'two words', execute() {} }), /"name"/);
		assert.match(validatePrefixCommand({ name: 'Ping', execute() {} }), /lower case/);
		assert.match(validatePrefixCommand({ name: 'ping', execute() {}, aliases: ['P'] }), /"aliases"/);
		assert.match(validatePrefixCommand({ name: 'test', execute() {}, aliases: 'x' }), /"aliases"/);
		assert.match(validatePrefixCommand({ name: 'test', execute() {}, args: 1 }), /"args"/);
		assert.match(validatePrefixCommand({ name: 'test', execute() {}, permissions: ['NotAPerm'] }), /"permissions"/);
	});
});

describe('loadSlashCommands', () => {
	it('capitalises folder names as categories, skips "_" files and reports broken files', (t) => {
		const directory = createFixture(t, {
			'fun/joke.js': slashCommandSource('joke'),
			'root.js': slashCommandSource('root'),
			'fun/_helpers.js': 'throw new Error("should not be loaded");',
			'fun/syntax.js': 'module.exports = {',
			'fun/invalid.js': `
const { SlashCommandBuilder } = require(${discordJsPath});
module.exports = { data: new SlashCommandBuilder().setName('Invalid Name').setDescription('x'), async execute() {} };`,
		});

		const { commands, failures } = loadSlashCommands(directory);
		assert.deepEqual([...commands.keys()].sort(), ['joke', 'root']);
		assert.equal(commands.get('joke').category, 'Fun');
		assert.equal(commands.get('root').category, 'General');

		const failedFiles = failures.map(({ file }) => file).sort();
		assert.deepEqual(failedFiles, [path.join('fun', 'invalid.js'), path.join('fun', 'syntax.js')]);
	});

	it('reports duplicate names', (t) => {
		const directory = createFixture(t, {
			'A/one.js': slashCommandSource('same'),
			'B/two.js': slashCommandSource('same'),
		});
		const { failures } = loadSlashCommands(directory);
		assert.equal(failures.length, 1);
		assert.match(failures[0].reason, /already used by A[\\/]one\.js/);
	});

	it('returns nothing for a missing directory', () => {
		assert.equal(loadSlashCommands(path.join(os.tmpdir(), 'missing-commands')).commands.size, 0);
	});
});

describe('loadPrefixCommands', () => {
	it('lets names win over aliases and skips conflicting aliases', (t) => {
		const directory = createFixture(t, {
			'A/help.js': prefixCommandSource('help', ['h', 'info', 'helpme']),
			'B/info.js': prefixCommandSource('info', ['h']),
		});

		const { commands, aliases, warnings } = loadPrefixCommands(directory);
		assert.deepEqual([...commands.keys()].sort(), ['help', 'info']);
		assert.equal(aliases.get('h'), 'help');
		assert.equal(aliases.get('helpme'), 'help');
		assert.equal(aliases.has('info'), false);
		assert.equal(warnings.length, 2);
	});
});
