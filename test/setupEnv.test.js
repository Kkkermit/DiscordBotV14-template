'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const util = require('node:util');
const { buildEnvFile, formatEnvValue, validateField } = require('../scripts/setup-env');
const { parseEnv } = require('../src/env');

describe('setup-env', () => {
	it('quotes values only when needed, using a quote the value does not contain', () => {
		assert.equal(formatEnvValue('abc.def'), 'abc.def');
		assert.equal(formatEnvValue('a b'), "'a b'");
		assert.equal(formatEnvValue("it's #1"), "`it's #1`");
		assert.throws(() => formatEnvValue(`'"\``));
	});

	it('validates a single field with the same rules as the bot', () => {
		assert.equal(validateField('DISCORD_GUILD_ID', '123456789012345678'), null);
		assert.match(validateField('DISCORD_GUILD_ID', 'abc'), /DISCORD_GUILD_ID/);
		assert.match(validateField('MONGODB_URI', 'localhost'), /MONGODB_URI/);
	});

	it('writes a file that Node.js parses back to the same values', (t) => {
		const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-env-'));
		t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
		const file = path.join(directory, '.env');
		const values = {
			DISCORD_TOKEN: 'token.with#hash',
			DISCORD_GUILD_ID: '123456789012345678',
			DEVELOPER_IDS: '123456789012345678, 223456789012345678',
			MONGODB_URI: 'mongodb+srv://user:p@ss@cluster.example.net/bot?retryWrites=true&w=majority',
		};
		fs.writeFileSync(file, buildEnvFile(values));

		// Node's own .env parser, without touching process.env.
		const parsed = util.parseEnv(fs.readFileSync(file, 'utf8'));
		assert.equal(parsed.DISCORD_TOKEN, values.DISCORD_TOKEN);
		assert.equal(parsed.MONGODB_URI, values.MONGODB_URI);
		assert.deepEqual(parseEnv(parsed).developerIds, ['123456789012345678', '223456789012345678']);
	});
});
