const DURATION_UNITS = Object.freeze([
	{ label: 'd', ms: 86_400_000 },
	{ label: 'h', ms: 3_600_000 },
	{ label: 'm', ms: 60_000 },
	{ label: 's', ms: 1_000 },
]);

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

function truncate(text, maxLength) {
	const value = String(text);
	if (value.length <= maxLength) return value;
	return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}

function joinLines(lines, maxLength) {
	const all = lines.join('\n');
	if (all.length <= maxLength) return all;

	// Drop lines from the end until the rest, plus a note saying how many are missing, fits.
	for (let keep = lines.length - 1; keep > 0; keep -= 1) {
		const text = [...lines.slice(0, keep), `…and ${lines.length - keep} more`].join('\n');
		if (text.length <= maxLength) return text;
	}
	return `…and ${lines.length} more`;
}

function formatMessage(template, values = {}) {
	return template.replace(/\{(\w+)\}/g, (match, key) => (Object.hasOwn(values, key) ? String(values[key]) : match));
}

// A zero-width space after each backtick stops user text from closing a code block early.
function escapeCodeBlock(text) {
	return String(text).replaceAll('`', '`\u200b');
}

module.exports = { formatDuration, truncate, joinLines, formatMessage, escapeCodeBlock };
