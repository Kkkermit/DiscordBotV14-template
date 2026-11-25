'use strict';

const { version: currentVersion } = require('../../package.json');
const { logger } = require('./logger');

const log = logger.child('Updates');

const VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

/**
 * Parses a semantic version such as `4.0.0`, `v4.1.0` or `5.0.0-beta.1`.
 *
 * @param {string} value
 * @returns {{ major: number, minor: number, patch: number, prerelease: string[] } | null}
 */
function parseVersion(value) {
	const match = VERSION_PATTERN.exec(String(value).trim());
	if (!match) return null;
	const [, major, minor, patch, prerelease] = match;
	return {
		major: Number(major),
		minor: Number(minor),
		patch: Number(patch),
		prerelease: prerelease?.split('.') ?? [],
	};
}

/**
 * Compares two prerelease identifier lists following the semver precedence rules.
 *
 * @param {string[]} a
 * @param {string[]} b
 * @returns {number}
 */
function comparePrerelease(a, b) {
	// A version without a prerelease (e.g. 1.0.0) is newer than any prerelease of it (1.0.0-beta).
	if (a.length === 0 || b.length === 0) return b.length - a.length;

	for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
		if (a[i] === undefined) return -1;
		if (b[i] === undefined) return 1;
		const aNumeric = /^\d+$/.test(a[i]);
		const bNumeric = /^\d+$/.test(b[i]);
		if (aNumeric && bNumeric && Number(a[i]) !== Number(b[i])) return Number(a[i]) - Number(b[i]);
		if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
		if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
	}
	return 0;
}

/**
 * Compares two semantic versions.
 *
 * @param {string} a
 * @param {string} b
 * @returns {-1 | 0 | 1 | null} `-1` if a < b, `0` if equal, `1` if a > b, `null` if either is not a valid version.
 */
function compareVersions(a, b) {
	const left = parseVersion(a);
	const right = parseVersion(b);
	if (!left || !right) return null;

	const difference =
		left.major - right.major ||
		left.minor - right.minor ||
		left.patch - right.patch ||
		comparePrerelease(left.prerelease, right.prerelease);
	return /** @type {-1 | 0 | 1} */ (Math.sign(difference));
}

/**
 * Fetches the tag of the latest GitHub release of a repository.
 *
 * @param {string} repository `owner/name`
 * @param {{ fetch?: typeof globalThis.fetch, timeoutMs?: number }} [options]
 * @returns {Promise<string | null>} The tag name, or `null` when the repository has no releases.
 */
async function fetchLatestReleaseTag(repository, { fetch = globalThis.fetch, timeoutMs = 5_000 } = {}) {
	const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
		headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'discord-bot-template-update-check' },
		signal: AbortSignal.timeout(timeoutMs),
	});
	if (response.status === 404) return null;
	if (!response.ok) throw new Error(`GitHub responded with ${response.status} ${response.statusText}`);

	const { tag_name: tagName } = await response.json();
	return typeof tagName === 'string' ? tagName : null;
}

/**
 * Logs whether a newer release of the template is available. Never throws.
 *
 * @param {{ repository: string, version?: string, fetch?: typeof globalThis.fetch }} options
 * @returns {Promise<'outdated' | 'latest' | 'unknown'>}
 */
async function checkForUpdates({ repository, version = currentVersion, fetch }) {
	const displayVersion = `v${String(version).replace(/^v/, '')}`;
	try {
		const latest = await fetchLatestReleaseTag(repository, { fetch });
		if (!latest) {
			log.debug(`No releases found for ${repository}.`);
			return 'unknown';
		}

		const comparison = compareVersions(version, latest);
		if (comparison === null) {
			log.debug(`Could not compare version "${version}" with the latest release "${latest}".`);
			return 'unknown';
		}
		if (comparison < 0) {
			log.warn(
				`A new version is available: ${latest} (you have ${displayVersion}). https://github.com/${repository}/releases`,
			);
			return 'outdated';
		}

		log.info(`You are running the latest version (${displayVersion}).`);
		return 'latest';
	} catch (error) {
		log.debug('Could not check for updates:', error);
		return 'unknown';
	}
}

module.exports = { parseVersion, compareVersions, fetchLatestReleaseTag, checkForUpdates };
