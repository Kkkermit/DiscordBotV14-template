'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { checkForUpdates, compareVersions, fetchLatestReleaseTag, parseVersion } = require('../src/lib/updateChecker');
require('./helpers/fakes'); // Silences the logger.

const jsonResponse = (status, body) => new Response(JSON.stringify(body), { status });

describe('parseVersion', () => {
	it('parses plain, v-prefixed and prerelease versions', () => {
		assert.deepEqual(parseVersion('v4.1.2'), { major: 4, minor: 1, patch: 2, prerelease: [] });
		assert.deepEqual(parseVersion('5.0.0-beta.1+build.7'), {
			major: 5,
			minor: 0,
			patch: 0,
			prerelease: ['beta', '1'],
		});
		assert.equal(parseVersion('latest'), null);
	});
});

describe('compareVersions', () => {
	it('compares numerically instead of alphabetically', () => {
		assert.equal(compareVersions('v3.0.9', 'v3.0.10'), -1);
		assert.equal(compareVersions('10.0.0', '9.9.9'), 1);
		assert.equal(compareVersions('4.0.0', 'v4.0.0'), 0);
	});

	it('follows semver prerelease precedence', () => {
		assert.equal(compareVersions('4.0.0-beta', '4.0.0'), -1);
		assert.equal(compareVersions('4.0.0-alpha', '4.0.0-beta'), -1);
		assert.equal(compareVersions('4.0.0-beta.2', '4.0.0-beta.11'), -1);
		assert.equal(compareVersions('4.0.0-beta', '4.0.0-beta.1'), -1);
		assert.equal(compareVersions('4.0.0-1', '4.0.0-alpha'), -1);
	});

	it('returns null for invalid versions', () => {
		assert.equal(compareVersions('4.0.0', null), null);
	});
});

describe('fetchLatestReleaseTag', () => {
	it('returns the tag of the latest release', async () => {
		const fetch = async (url) => {
			assert.equal(url, 'https://api.github.com/repos/owner/repo/releases/latest');
			return jsonResponse(200, { tag_name: 'v4.2.0' });
		};
		assert.equal(await fetchLatestReleaseTag('owner/repo', { fetch }), 'v4.2.0');
	});

	it('returns null when there are no releases', async () => {
		assert.equal(await fetchLatestReleaseTag('owner/repo', { fetch: async () => jsonResponse(404, {}) }), null);
	});

	it('throws on other errors', async () => {
		await assert.rejects(fetchLatestReleaseTag('owner/repo', { fetch: async () => jsonResponse(500, {}) }));
	});
});

describe('checkForUpdates', () => {
	const fetchTag = (tag) => async () => jsonResponse(200, { tag_name: tag });

	it('detects newer, equal and missing releases', async () => {
		assert.equal(
			await checkForUpdates({ repository: 'o/r', version: '4.0.0', fetch: fetchTag('v4.0.1') }),
			'outdated',
		);
		assert.equal(
			await checkForUpdates({ repository: 'o/r', version: '4.0.0', fetch: fetchTag('v4.0.0') }),
			'latest',
		);
		assert.equal(
			await checkForUpdates({ repository: 'o/r', version: '4.0.0', fetch: fetchTag('nightly') }),
			'unknown',
		);
	});

	it('never throws, even when the request fails', async () => {
		const fetch = async () => {
			throw new Error('offline');
		};
		assert.equal(await checkForUpdates({ repository: 'o/r', version: '4.0.0', fetch }), 'unknown');
	});
});
