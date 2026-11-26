// npm run prepare-release <patch|minor|major>
// Raises the version in package.json and package-lock.json, and moves the notes under "## Unreleased" in
// CHANGELOG.md to a heading for the new version. See docs/branching-and-releases.md.

const fs = require('node:fs');
const path = require('node:path');
const { logger } = require('../src/lib/logger');
const { parseVersion } = require('../src/lib/updateChecker');
const { findChangelogSection } = require('./release-notes');

const log = logger.child('Release');
const ROOT = path.join(__dirname, '..');

function bumpVersion(version, type) {
	const parts = parseVersion(version);
	if (!parts) throw new Error(`"${version}" in package.json is not a version like 1.2.3.`);

	const [major, minor, patch] = parts;
	if (type === 'major') return `${major + 1}.0.0`;
	if (type === 'minor') return `${major}.${minor + 1}.0`;
	if (type === 'patch') return `${major}.${minor}.${patch + 1}`;
	throw new Error(
		'Choose how big the release is: "patch" (bug fixes), "minor" (new features) or "major" (breaking changes).',
	);
}

function addReleaseToChangelog(changelog, version, date) {
	const unreleased = findChangelogSection(changelog, 'Unreleased');
	if (!unreleased) throw new Error('CHANGELOG.md has no "## Unreleased" heading.');
	if (!unreleased.notes) {
		throw new Error(
			'Nothing is listed under "## Unreleased" in CHANGELOG.md. Add the changes in this release first.',
		);
	}
	if (findChangelogSection(changelog, version)) throw new Error(`CHANGELOG.md already has a ${version} section.`);

	// Keep an empty "Unreleased" heading at the top for the next changes.
	const lines = changelog.split(/\r?\n/);
	return [
		...lines.slice(0, unreleased.start + 1),
		'',
		`## ${version} - ${date}`,
		'',
		unreleased.notes,
		'',
		...lines.slice(unreleased.end),
	].join('\n');
}

function prepareRelease(type, root = ROOT, date = new Date().toISOString().slice(0, 10)) {
	const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
	const writeJson = (file, data) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, '\t')}\n`);
	const changelogPath = path.join(root, 'CHANGELOG.md');

	// Work everything out before writing, so a mistake leaves every file as it was.
	const packageJson = readJson('package.json');
	const packageLock = readJson('package-lock.json');
	const version = bumpVersion(packageJson.version, type);
	const changelog = addReleaseToChangelog(fs.readFileSync(changelogPath, 'utf8'), version, date);

	packageJson.version = version;
	packageLock.version = version;
	packageLock.packages[''].version = version;
	writeJson('package.json', packageJson);
	writeJson('package-lock.json', packageLock);
	fs.writeFileSync(changelogPath, changelog);
	return version;
}

if (require.main === module) {
	try {
		const version = prepareRelease(process.argv[2]);
		log.success(`Prepared version ${version} in package.json, package-lock.json and CHANGELOG.md.`);
		log.info('Next: commit this on a release/ branch, merge it into develop, then merge develop into main.');
	} catch (error) {
		log.error(error.message);
		process.exitCode = 1;
	}
}

module.exports = { bumpVersion, addReleaseToChangelog, prepareRelease };
