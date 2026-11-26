const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const { addReleaseToChangelog, bumpVersion, prepareRelease } = require('../../scripts/prepare-release');

const CHANGELOG = `# Changelog

## Unreleased

### Fixed

- A bug.

## 4.0.0

- The first release.
`;

function createProject(t, changelog = CHANGELOG) {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prepare-release-'));
	t.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const writeJson = (file, data) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, '\t')}\n`);
	writeJson('package.json', { name: 'bot', version: '4.0.0' });
	writeJson('package-lock.json', {
		name: 'bot',
		version: '4.0.0',
		packages: { '': { name: 'bot', version: '4.0.0' } },
	});
	fs.writeFileSync(path.join(root, 'CHANGELOG.md'), changelog);
	const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
	return { root, read };
}

describe('prepare-release', () => {
	it('raises the right part of the version', () => {
		assert.equal(bumpVersion('4.2.3', 'patch'), '4.2.4');
		assert.equal(bumpVersion('4.2.3', 'minor'), '4.3.0');
		assert.equal(bumpVersion('4.2.3', 'major'), '5.0.0');
		assert.throws(() => bumpVersion('4.2.3', undefined), /patch.*minor.*major/);
		assert.throws(() => bumpVersion('latest', 'patch'), /not a version/);
	});

	it('moves the unreleased notes under the new version and keeps an empty Unreleased heading', () => {
		const changelog = addReleaseToChangelog(CHANGELOG, '4.0.1', '2026-11-26');
		assert.equal(
			changelog,
			`# Changelog

## Unreleased

## 4.0.1 - 2026-11-26

### Fixed

- A bug.

## 4.0.0

- The first release.
`,
		);
	});

	it('refuses a release without notes or with a version that already has a section', () => {
		const empty = '# Changelog\n\n## Unreleased\n\n## 4.0.0\n\n- The first release.\n';
		assert.throws(() => addReleaseToChangelog(empty, '4.0.1', '2026-11-26'), /Nothing is listed/);
		assert.throws(() => addReleaseToChangelog(CHANGELOG, '4.0.0', '2026-11-26'), /already has a 4.0.0 section/);
		assert.throws(() => addReleaseToChangelog('# Changelog\n', '4.0.1', '2026-11-26'), /no "## Unreleased"/);
	});

	it('updates package.json, package-lock.json and CHANGELOG.md together', (t) => {
		const { root, read } = createProject(t);

		assert.equal(prepareRelease('minor', root, '2026-11-26'), '4.1.0');
		assert.equal(JSON.parse(read('package.json')).version, '4.1.0');
		const lock = JSON.parse(read('package-lock.json'));
		assert.equal(lock.version, '4.1.0');
		assert.equal(lock.packages[''].version, '4.1.0');
		assert.match(read('CHANGELOG.md'), /## Unreleased\n\n## 4\.1\.0 - 2026-11-26\n\n### Fixed/);
		assert.match(read('package.json'), /^{\n\t"name"/, 'keeps tab indentation');
	});

	it('changes nothing when the changelog is not ready', (t) => {
		const { root, read } = createProject(t, '# Changelog\n\n## Unreleased\n');

		assert.throws(() => prepareRelease('patch', root, '2026-11-26'), /Nothing is listed/);
		assert.equal(JSON.parse(read('package.json')).version, '4.0.0');
		assert.equal(JSON.parse(read('package-lock.json')).version, '4.0.0');
	});
});
