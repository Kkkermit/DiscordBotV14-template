const { version: currentVersion } = require('../../package.json');
const { logger } = require('./logger');

const log = logger.child('Updates');

function parseVersion(version) {
	const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(version).trim());
	return match ? match.slice(1).map(Number) : null;
}

function compareVersions(a, b) {
	const left = parseVersion(a);
	const right = parseVersion(b);
	if (!left || !right) return null;

	for (let i = 0; i < 3; i += 1) {
		if (left[i] !== right[i]) return left[i] - right[i];
	}
	return 0;
}

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
