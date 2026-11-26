const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');
const { findChangelogSection } = require('../../scripts/release-notes');

const CHANGELOG = `# Changelog

## Unreleased

## 4.1.0 - 2026-11-26

### Added

- Something new.

## 4.0.10

- An old fix.
`;

describe('release-notes', () => {
	it('returns the notes of one version, with or without a date in the heading', () => {
		assert.equal(findChangelogSection(CHANGELOG, '4.1.0').notes, '### Added\n\n- Something new.');
		assert.equal(findChangelogSection(CHANGELOG, '4.0.10').notes, '- An old fix.');
	});

	it('does not mistake one version for another that starts the same way', () => {
		assert.equal(findChangelogSection(CHANGELOG, '4.0.1'), null);
		assert.equal(findChangelogSection(CHANGELOG, '4.1'), null);
	});

	it('returns empty notes for an empty section', () => {
		assert.equal(findChangelogSection(CHANGELOG, 'Unreleased').notes, '');
	});

	it('prints the notes of the current version from the real CHANGELOG.md', () => {
		const { version } = require('../../package.json');
		const script = path.join(__dirname, '..', '..', 'scripts', 'release-notes.js');
		const changelog = fs.readFileSync(path.join(__dirname, '..', '..', 'CHANGELOG.md'), 'utf8');

		const output = execFileSync(process.execPath, [script, version], { encoding: 'utf8' });
		assert.equal(output.trim(), findChangelogSection(changelog, version).notes);
		assert.ok(output.trim().length > 0, `CHANGELOG.md should have notes for ${version}`);
	});
});
