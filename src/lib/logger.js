'use strict';

const { formatWithOptions } = require('node:util');

/** Levels a user can choose with `LOG_LEVEL`, from most to least verbose. */
const LEVEL_NAMES = ['debug', 'info', 'warn', 'error'];

/** `success` is printed at the same level as `info`. */
const SEVERITY = { debug: 0, info: 1, success: 1, warn: 2, error: 3 };

const ANSI = {
	reset: '\x1b[0m',
	dim: '\x1b[2m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	blue: '\x1b[34m',
	pink: '\x1b[38;5;213m',
	turquoise: '\x1b[38;5;45m',
	orange: '\x1b[38;5;202m',
};

/** Width of the longest label, `SUCCESS`, so messages line up. */
const LABEL_WIDTH = 7;

const LEVEL_COLORS = {
	debug: ANSI.blue,
	info: ANSI.turquoise,
	success: ANSI.green,
	warn: ANSI.orange,
	error: ANSI.red,
};

/**
 * Whether a stream can show colours. Follows the NO_COLOR (https://no-color.org) and FORCE_COLOR conventions.
 *
 * @param {NodeJS.WritableStream & { isTTY?: boolean, hasColors?: () => boolean }} stream
 * @param {NodeJS.ProcessEnv} [env]
 */
function supportsColor(stream, env = process.env) {
	if (env.NO_COLOR) return false;
	if (env.FORCE_COLOR !== undefined) return env.FORCE_COLOR !== '0' && env.FORCE_COLOR !== 'false';
	return Boolean(stream.isTTY && stream.hasColors?.());
}

/**
 * Formats a date as `YYYY-MM-DD HH:mm:ss` in local time.
 *
 * @param {Date} date
 */
function formatTimestamp(date) {
	const pad = (value) => String(value).padStart(2, '0');
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
	return `${day} ${time}`;
}

/**
 * @typedef {object} ScopedLogger A logger that labels every message, created with `logger.child('Label')`.
 * @property {(...args: unknown[]) => void} debug
 * @property {(...args: unknown[]) => void} info
 * @property {(...args: unknown[]) => void} success
 * @property {(...args: unknown[]) => void} warn
 * @property {(...args: unknown[]) => void} error
 */

/**
 * A small console logger with levels, labels and colours.
 *
 * Everything is written to one stream (stdout by default) so messages stay in order
 * when Docker, PM2 or a hosting panel collects the output.
 */
class Logger {
	/**
	 * @param {object} [options]
	 * @param {string} [options.level] Minimum level to print, one of `LEVEL_NAMES`.
	 * @param {NodeJS.WritableStream} [options.stream]
	 * @param {boolean} [options.colors] Detected from the stream when omitted.
	 * @param {() => Date} [options.now] Clock for timestamps, so tests can use a fixed time.
	 */
	constructor({
		level = 'info',
		stream = process.stdout,
		colors = supportsColor(stream),
		now = () => new Date(),
	} = {}) {
		this.stream = stream;
		this.colors = colors;
		this.now = now;
		this.setLevel(level);
	}

	/** @param {string} level One of `LEVEL_NAMES`. */
	setLevel(level) {
		const name = String(level).toLowerCase();
		if (!LEVEL_NAMES.includes(name)) {
			throw new RangeError(`Unknown log level "${level}". Use one of: ${LEVEL_NAMES.join(', ')}.`);
		}
		this.level = name;
	}

	/**
	 * Returns a logger that prefixes messages with `[label]`. It writes through this logger,
	 * so changing this logger's level also changes what the child prints.
	 *
	 * @param {string} label
	 * @returns {ScopedLogger}
	 */
	child(label) {
		return {
			debug: (...args) => this.write('debug', label, args),
			info: (...args) => this.write('info', label, args),
			success: (...args) => this.write('success', label, args),
			warn: (...args) => this.write('warn', label, args),
			error: (...args) => this.write('error', label, args),
		};
	}

	debug(...args) {
		this.write('debug', null, args);
	}

	info(...args) {
		this.write('info', null, args);
	}

	success(...args) {
		this.write('success', null, args);
	}

	warn(...args) {
		this.write('warn', null, args);
	}

	error(...args) {
		this.write('error', null, args);
	}

	/**
	 * @param {keyof typeof SEVERITY} level
	 * @param {string | null} label
	 * @param {unknown[]} args Anything `console.log` accepts. Errors are printed with their stack.
	 */
	write(level, label, args) {
		if (SEVERITY[level] < SEVERITY[this.level]) return;

		const paint = (color, text) => (this.colors ? `${color}${text}${ANSI.reset}` : text);
		const parts = [
			paint(ANSI.dim, formatTimestamp(this.now())),
			paint(LEVEL_COLORS[level], level.toUpperCase().padEnd(LABEL_WIDTH)),
		];
		if (label) parts.push(paint(ANSI.pink, `[${label}]`));
		parts.push(formatWithOptions({ colors: this.colors }, ...args));

		this.stream.write(`${parts.join(' ')}\n`);
	}
}

/** The bot's logger. `src/index.js` sets its level from `LOG_LEVEL`. */
const logger = new Logger();

module.exports = { logger, Logger, LEVEL_NAMES, ANSI, supportsColor, formatTimestamp };
