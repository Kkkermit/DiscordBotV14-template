const { version: currentVersion } = require('../../package.json');
const { logger } = require('./logger');

const log = logger.child('Updates');

/**
 * Turns a version such as `4.1.0` or `v4.1.0` into `[4, 1, 0]`.
 * Anything after the patch number (e.g. `-beta.1`) is ignored.
 *
 * @param {string} version
 * @returns {number[] | null} `null` when the text isn't a version.
 */
function parseVersion(version) {
	const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(version).trim());
	return match ? match.slice(1).map(Number) : null;
}

/**
 * Compares two versions number by number, so `3.0.10` is correctly newer than `3.0.9`.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number | null} Negative if `a` is older, `0` if equal, positive if newer, `null` if not comparable.
 */
function compareVersions(a, b) {
	const left = parseVersion(a);
	const right = parseVersion(b);
	if (!left || !right) return null;

	for (let i = 0; i < 3; i += 1) {
		if (left[i] !== right[i]) return left[i] - right[i];
	}
	return 0;
}

/**
 * @param {string} repository `owner/name`
 * @param {typeof globalThis.fetch} [fetch] Replaceable for tests.
 * @returns {Promise<string | null>} The latest release's tag, or `null` when there are no releases.
 */
async function fetchLatestReleaseTag(repository, fetch = globalThis.fetch) {
	const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
		headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'discord-bot-template-update-check' },
		signal: AbortSignal.timeout(5_000),
	});
	if (response.status === 404) return null;
	if (!response.ok) throw new Error(`GitHub responded with ${response.status}.`);

	const release = await response.json();
	return typeof release.tag_name === 'string' ? release.tag_name : null;
}

/**
 * Logs whether a newer release is available. Never throws: an update check must not stop the bot.
 *
 * @param {object} options
 * @param {string} options.repository `owner/name`
 * @param {string} [options.version] Defaults to the version in `package.json`.
 * @param {typeof globalThis.fetch} [options.fetch]
 * @returns {Promise<'outdated' | 'latest' | 'unknown'>}
 */
async function checkForUpdates({ repository, version = currentVersion, fetch }) {
	try {
		const latest = await fetchLatestReleaseTag(repository, fetch);
		const comparison = latest ? compareVersions(version, latest) : null;

		if (comparison === null) {
			log.debug(`Could not compare v${version} with the latest release of ${repository} (${latest ?? 'none'}).`);
			return 'unknown';
		}
		if (comparison < 0) {
			log.warn(
				`A new version is available: ${latest} (you have v${version}). https://github.com/${repository}/releases`,
			);
			return 'outdated';
		}

		log.info(`You are running the latest version (v${version}).`);
		return 'latest';
	} catch (error) {
		log.debug('Could not check for updates:', error);
		return 'unknown';
	}
}

module.exports = { parseVersion, compareVersions, fetchLatestReleaseTag, checkForUpdates };
