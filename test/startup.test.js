const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const path = require('node:path');
const { describe, it } = require('node:test');
const { promisify } = require('node:util');

const run = promisify(execFile);
const ROOT = path.join(__dirname, '..');

/**
 * Runs a script with the given environment variables and returns its output and exit code.
 * Variables set to an empty string also stop a developer's own `.env` file from filling them in.
 */
async function runScript(script, env) {
	const options = { cwd: ROOT, env: { PATH: process.env.PATH, NO_COLOR: '1', ...env }, timeout: 20_000 };
	try {
		const { stdout } = await run(process.execPath, [script], options);
		return { code: 0, output: stdout };
	} catch (error) {
		return { code: error.code, output: `${error.stdout}${error.stderr}` };
	}
}

const EMPTY_ENV = { DISCORD_TOKEN: '', DISCORD_GUILD_ID: '', DEVELOPER_IDS: '', MONGODB_URI: '', LOG_LEVEL: '' };

describe('startup', () => {
	it('explains a missing token and exits with code 1', async () => {
		const { code, output } = await runScript('src/index.js', EMPTY_ENV);
		assert.equal(code, 1);
		assert.match(output, /DISCORD_TOKEN is required/);
		assert.match(output, /npm run setup/);
	});

	it('reports every invalid variable at once', async () => {
		const { code, output } = await runScript('src/index.js', {
			...EMPTY_ENV,
			DISCORD_TOKEN: 'token',
			DISCORD_GUILD_ID: 'my-server',
			LOG_LEVEL: 'loud',
		});
		assert.equal(code, 1);
		assert.match(output, /DISCORD_GUILD_ID must be a server ID/);
		assert.match(output, /LOG_LEVEL must be one of/);
	});

	it('npm run deploy also refuses to run without a token', async () => {
		const { code, output } = await runScript('scripts/deploy-commands.js', EMPTY_ENV);
		assert.equal(code, 1);
		assert.match(output, /DISCORD_TOKEN is required/);
	});
});
