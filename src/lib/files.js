const fs = require('node:fs');
const path = require('node:path');

// Files and folders starting with "_" are skipped, so helpers can sit next to commands.
function isIgnored(directory, file) {
	return path
		.relative(directory, file)
		.split(path.sep)
		.some((part) => part.startsWith('_'));
}

function findJsFiles(directory) {
	if (!fs.existsSync(directory)) return [];

	return fs
		.readdirSync(directory, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
		.map((entry) => path.join(entry.parentPath, entry.name))
		.filter((file) => !isIgnored(directory, file))
		.sort((a, b) => a.localeCompare(b));
}

function getCategory(baseDirectory, filePath) {
	const [folder, ...rest] = path.relative(baseDirectory, filePath).split(path.sep);
	if (rest.length === 0) return 'General';
	return folder.charAt(0).toUpperCase() + folder.slice(1);
}

module.exports = { findJsFiles, getCategory };
