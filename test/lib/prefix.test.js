const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { getPrefixes, parsePrefixCommand } = require('../../src/lib/prefix');

describe('parsePrefixCommand', () => {
	it('splits the command name and arguments', () => {
		assert.deepEqual(parsePrefixCommand('?Say  hello   world', ['?']), {
			prefix: '?',
			name: 'say',
			args: ['hello', 'world'],
		});
	});

	it('matches prefixes case-insensitively', () => {
		assert.equal(parsePrefixCommand('BOT ping', ['bot '])?.name, 'ping');
	});

	it('returns null for messages that are not commands', () => {
		assert.equal(parsePrefixCommand('hello', ['?']), null);
		assert.equal(parsePrefixCommand('?', ['?']), null);
		assert.equal(parsePrefixCommand('?   ', ['?']), null);
	});

	it('supports a mention as prefix', () => {
		assert.deepEqual(parsePrefixCommand('<@123> help ping', ['<@123>']), {
			prefix: '<@123>',
			name: 'help',
			args: ['ping'],
		});
	});
});

describe('getPrefixes', () => {
	const client = (mentionAsPrefix) => ({
		config: { prefix: '?', commands: { mentionAsPrefix } },
		user: { id: '123' },
	});

	it('includes both mention formats when enabled, longest first', () => {
		assert.deepEqual(getPrefixes(client(true)), ['<@!123>', '<@123>', '?']);
	});

	it('only uses the configured prefix when mentions are disabled', () => {
		assert.deepEqual(getPrefixes(client(false)), ['?']);
	});
});
