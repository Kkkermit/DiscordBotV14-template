// Prints the notes of one version from CHANGELOG.md: node scripts/release-notes.js 4.1.0
// The release workflows use it for the text of the GitHub release, and it fails when the version has no notes.

const fs = require('node:fs');
const path = require('node:path');

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

// Finds the "## <title>" heading (text after it, such as a date, is allowed) and the lines up to the next "## ".
function findChangelogSection(changelog, title) {
	const lines = changelog.split(/\r?\n/);
	const start = lines.findIndex((line) => line === `## ${title}` || line.startsWith(`## ${title} `));
	if (start === -1) return null;

	const next = lines.findIndex((line, index) => index > start && line.startsWith('## '));
	const end = next === -1 ? lines.length : next;
	const notes = lines.slice(start + 1, end).join('\n');
	return { start, end, notes: notes.trim() };
}

function main() {
	const version = process.argv[2];
	if (!version) {
		console.error('Usage: node scripts/release-notes.js <version>');
		process.exitCode = 1;
		return;
	}

	const section = findChangelogSection(fs.readFileSync(CHANGELOG_PATH, 'utf8'), version);
	if (!section?.notes) {
		console.error(`CHANGELOG.md has no notes for ${version}. Run "npm run prepare-release" to add them.`);
		process.exitCode = 1;
		return;
	}
	console.log(section.notes);
}

if (require.main === module) main();

module.exports = { findChangelogSection };
