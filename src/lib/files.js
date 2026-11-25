'use strict';

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
 * Returns the category of a file: the name of the first folder below `baseDirectory`.
 * Files placed directly in `baseDirectory` are put in the `General` category.
 *
 * @example getCategory('/bot/commands/slash', '/bot/commands/slash/Utility/ping.js') // 'Utility'
 * @param {string} baseDirectory
 * @param {string} filePath
 * @returns {string}
 */
function getCategory(baseDirectory, filePath) {
	const segments = path.relative(baseDirectory, filePath).split(path.sep);
	return segments.length > 1 ? segments[0] : 'General';
}

module.exports = { findJsFiles, getCategory };
