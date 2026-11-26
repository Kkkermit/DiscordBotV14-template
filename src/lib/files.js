const fs = require('node:fs');
const path = require('node:path');

/**
 * @param {string} directory
 * @param {string} file
 * @returns {boolean} Whether the file, or a folder it is in, starts with `_`.
 */
function isIgnored(directory, file) {
	return path
		.relative(directory, file)
		.split(path.sep)
		.some((part) => part.startsWith('_'));
}

/**
 * Recursively lists the `.js` files inside a directory, sorted for a stable load order.
 *
 * Files and folders whose name starts with `_` are skipped, so you can keep shared helpers
 * (e.g. `commands/slash/_shared.js`) next to your commands without them being loaded as one.
 *
 * @param {string} directory Absolute path to search.
 * @returns {string[]} Absolute file paths. Empty when the directory does not exist.
 */
function findJsFiles(directory) {
	if (!fs.existsSync(directory)) return [];

	return fs
		.readdirSync(directory, { recursive: true, withFileTypes: true })
		.filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
		.map((entry) => path.join(entry.parentPath, entry.name))
		.filter((file) => !isIgnored(directory, file))
		.sort((a, b) => a.localeCompare(b));
}

/**
 * Returns the category of a file for display: its first folder below `baseDirectory`, capitalised.
 * Files placed directly in `baseDirectory` are put in the `General` category.
 *
 * @example getCategory('/bot/commands/slash', '/bot/commands/slash/utility/ping.js') // 'Utility'
 * @param {string} baseDirectory
 * @param {string} filePath
 */
function getCategory(baseDirectory, filePath) {
	const [folder, ...rest] = path.relative(baseDirectory, filePath).split(path.sep);
	if (rest.length === 0) return 'General';
	return folder.charAt(0).toUpperCase() + folder.slice(1);
}

module.exports = { findJsFiles, getCategory };
