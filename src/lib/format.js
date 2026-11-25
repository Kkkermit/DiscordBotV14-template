'use strict';

const DURATION_UNITS = Object.freeze([
	{ label: 'd', ms: 86_400_000 },
	{ label: 'h', ms: 3_600_000 },
	{ label: 'm', ms: 60_000 },
	{ label: 's', ms: 1_000 },
]);

/**
 * Formats a duration as a compact string such as `2d 4h 0m 9s`.
 * Leading zero units are dropped, so 65 seconds becomes `1m 5s`.
 *
 * @param {number} milliseconds
 * @returns {string}
 */
function formatDuration(milliseconds) {
	let remaining = Math.max(0, Math.floor(Number(milliseconds) || 0));
	const parts = [];

	for (const { label, ms } of DURATION_UNITS) {
		const value = Math.floor(remaining / ms);
		remaining -= value * ms;
		if (value > 0 || parts.length > 0 || label === 's') parts.push(`${value}${label}`);
	}

	return parts.join(' ');
}

/**
 * Shortens text to `maxLength` characters, adding an ellipsis when it was cut.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
function truncate(text, maxLength) {
	const value = String(text);
	if (value.length <= maxLength) return value;
	return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}

/**
 * Joins lines with line breaks, leaving out whole lines (never half of one) to stay within `maxLength`.
 * When lines are left out, the last line says how many.
 *
 * @param {string[]} lines
 * @param {number} maxLength
 * @returns {string}
 */
function joinLines(lines, maxLength) {
	const kept = [];
	let length = 0;
	for (const [index, line] of lines.entries()) {
		const more = `…and ${lines.length - index} more`;
		const isLast = index === lines.length - 1;
		// Keep room for the "…and N more" line unless this is the last line.
		if (length + line.length + (isLast ? 0 : more.length + 1) > maxLength) {
			kept.push(more);
			break;
		}
		kept.push(line);
		length += line.length + 1;
	}
	return kept.join('\n');
}

/**
 * Replaces `{placeholders}` in a template with values. Unknown placeholders are left untouched.
 *
 * @example formatMessage('Hello {name}!', { name: 'world' }) // 'Hello world!'
 * @param {string} template
 * @param {Record<string, string | number>} values
 * @returns {string}
 */
function formatMessage(template, values = {}) {
	return template.replace(/\{(\w+)\}/g, (match, key) => (Object.hasOwn(values, key) ? String(values[key]) : match));
}

/**
 * Makes user-provided text safe to put inside a Markdown code block: a zero-width space after every
 * backtick means no run of three can close the block early.
 *
 * @param {string} text
 * @returns {string}
 */
function escapeCodeBlock(text) {
	return String(text).replaceAll('`', '`\u200b');
}

module.exports = { formatDuration, truncate, joinLines, formatMessage, escapeCodeBlock };
