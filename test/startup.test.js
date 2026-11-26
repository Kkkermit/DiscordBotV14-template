const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const path = require('node:path');
const { describe, it } = require('node:test');
const { promisify } = require('node:util');

const run = promisify(execFile);
const ROOT = path.join(__dirname, '..');

async function startBot(env) {
	const options = { cwd: ROOT, env: { PATH: process.env.PATH, NO_COLOR: '1', ...env }, timeout: 20_000 };
	try {
		const { stdout } = await run(process.execPath, ['src/index.js'], options);
		return { code: 0, output: stdout };
	} catch (error) {
		return { code: error.code, output: `${error.stdout}${error.stderr}` };
	}
}

const EMPTY_ENV = { DISCORD_TOKEN: '', DEVELOPER_IDS: '', MONGODB_URI: '', LOG_LEVEL: '' };

describe('startup', () => {
	it('explains a missing token and exits with code 1', async () => {
		const { code, output } = await startBot(EMPTY_ENV);
		assert.equal(code, 1);
		assert.match(output, /DISCORD_TOKEN is required/);
		assert.match(output, /npm run setup/);
	});

	it('reports every invalid variable at once', async () => {
		const { code, output } = await startBot({
			...EMPTY_ENV,
			DISCORD_TOKEN: 'token',
			DEVELOPER_IDS: 'me',
			LOG_LEVEL: 'loud',
		});
		assert.equal(code, 1);
		assert.match(output, /DEVELOPER_IDS must be a comma-separated list of user IDs/);
		assert.match(output, /LOG_LEVEL must be one of/);
	});
});
