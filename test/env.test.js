const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const { EnvValidationError, loadEnvFile, parseEnv } = require('../src/env');

const TOKEN = 'test-token';

describe('parseEnv', () => {
	it('returns normalised values with defaults', () => {
		const env = parseEnv({ DISCORD_TOKEN: ` ${TOKEN} ` });
		assert.deepEqual(env, { token: TOKEN, guildId: null, developerIds: [], mongoUri: null, logLevel: 'info' });
		assert.ok(Object.isFrozen(env));
	});

	it('parses every optional variable', () => {
		const env = parseEnv({
			DISCORD_TOKEN: TOKEN,
			DISCORD_GUILD_ID: '123456789012345678',
			DEVELOPER_IDS: '123456789012345678, 223456789012345678,123456789012345678',
			MONGODB_URI: 'mongodb+srv://user:pass@cluster.example.net/bot',
			LOG_LEVEL: 'DEBUG',
		});
		assert.equal(env.guildId, '123456789012345678');
		assert.deepEqual(env.developerIds, ['123456789012345678', '223456789012345678']);
		assert.equal(env.mongoUri, 'mongodb+srv://user:pass@cluster.example.net/bot');
		assert.equal(env.logLevel, 'debug');
	});

	it('treats empty values as unset', () => {
		const env = parseEnv({ DISCORD_TOKEN: TOKEN, DISCORD_GUILD_ID: '', MONGODB_URI: '   ' });
		assert.equal(env.guildId, null);
		assert.equal(env.mongoUri, null);
	});

	it('reports every problem at once', () => {
		assert.throws(
			() => parseEnv({ DISCORD_GUILD_ID: 'abc', DEVELOPER_IDS: '1', MONGODB_URI: 'http://x', LOG_LEVEL: 'loud' }),
			(error) => {
				assert.ok(error instanceof EnvValidationError);
				assert.equal(error.issues.length, 5);
				assert.match(error.issues[0], /DISCORD_TOKEN is required/);
				return true;
			},
		);
	});
});

describe('loadEnvFile', () => {
	it('returns false when the file does not exist', () => {
		assert.equal(loadEnvFile(path.join(os.tmpdir(), 'does-not-exist', '.env')), false);
	});

	it('loads variables without overriding ones that are already set', (t) => {
		const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'env-test-'));
		t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
		const file = path.join(directory, '.env');
		fs.writeFileSync(file, 'ENV_TEST_FROM_FILE=file\nENV_TEST_EXISTING=file\n');

		process.env.ENV_TEST_EXISTING = 'process';
		t.after(() => {
			delete process.env.ENV_TEST_FROM_FILE;
			delete process.env.ENV_TEST_EXISTING;
		});

		assert.equal(loadEnvFile(file), true);
		assert.equal(process.env.ENV_TEST_FROM_FILE, 'file');
		assert.equal(process.env.ENV_TEST_EXISTING, 'process');
	});
});
