'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const config = require('../../src/config');
const { validateConfig } = require('../../src/lib/validateConfig');

/** Returns a copy of the default config with some top-level keys replaced. */
const withChanges = (changes) => ({ ...config, ...changes });

describe('validateConfig', () => {
	it('accepts the default config', () => {
		assert.deepEqual(validateConfig(config), []);
	});

	it('rejects an empty or spaced prefix', () => {
		assert.equal(validateConfig(withChanges({ prefix: '' })).length, 1);
		assert.equal(validateConfig(withChanges({ prefix: '! ' })).length, 1);
	});

	it('rejects unknown colours and statuses', () => {
		const issues = validateConfig(
			withChanges({ embedColor: 'NotAColour', presence: { ...config.presence, status: 'busy' } }),
		);
		assert.equal(issues.length, 2);
	});

	it('enforces the presence rate limit', () => {
		const issues = validateConfig(withChanges({ presence: { ...config.presence, rotateIntervalSeconds: 5 } }));
		assert.match(issues[0], /at least 15/);
		assert.deepEqual(
			validateConfig(withChanges({ presence: { ...config.presence, rotateIntervalSeconds: 0 } })),
			[],
		);
	});

	it('validates the log channel and repository', () => {
		const issues = validateConfig(
			withChanges({
				logging: { commandLogChannelId: 'general' },
				updateCheck: { enabled: true, repository: 'not a repo' },
			}),
		);
		assert.equal(issues.length, 2);
	});

	it('requires every message', () => {
		const issues = validateConfig(withChanges({ messages: { ...config.messages, error: '' } }));
		assert.deepEqual(issues, ['messages.error must not be empty.']);
	});
});
