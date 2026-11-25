'use strict';

const { formatWithOptions } = require('node:util');

/** Numeric severity of each log level. Messages below the active level are dropped. */
const LEVELS = Object.freeze({ debug: 10, info: 20, success: 20, warn: 30, error: 40 });

/** Levels a user can choose with `LOG_LEVEL`. `success` is an alias of `info` so it is not listed. */
const LEVEL_NAMES = Object.freeze(['debug', 'info', 'warn', 'error']);

const ANSI = Object.freeze({
	reset: '\x1b[0m',
	dim: '\x1b[2m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	pink: '\x1b[38;5;213m',
	turquoise: '\x1b[38;5;45m',
	orange: '\x1b[38;5;202m',
});

const LEVEL_STYLES = Object.freeze({
	debug: { label: 'DEBUG', color: ANSI.blue },
	info: { label: 'INFO', color: ANSI.turquoise },
	success: { label: 'SUCCESS', color: ANSI.green },
	warn: { label: 'WARN', color: ANSI.orange },
	error: { label: 'ERROR', color: ANSI.red },
});

const LABEL_WIDTH = Math.max(...Object.values(LEVEL_STYLES).map(({ label }) => label.length));

/**
 * Works out whether a stream can display ANSI colours, honouring the
 * {@link https://no-color.org NO_COLOR} and FORCE_COLOR conventions.
 *
 * @param {NodeJS.WritableStream & { isTTY?: boolean, hasColors?: () => boolean }} stream
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {boolean}
 */
function supportsColor(stream, env = process.env) {
	if (env.NO_COLOR !== undefined && env.NO_COLOR !== '') return false;
	if (env.FORCE_COLOR !== undefined) return env.FORCE_COLOR !== '0' && env.FORCE_COLOR !== 'false';
	return Boolean(stream?.isTTY && typeof stream.hasColors === 'function' && stream.hasColors());
}

/**
 * Formats a date as `YYYY-MM-DD HH:mm:ss` in local time.
 *
 * @param {Date} [date]
 * @returns {string}
 */
function formatTimestamp(date = new Date()) {
	const pad = (value) => String(value).padStart(2, '0');
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
	return `${day} ${time}`;
}

/**
 * @typedef {object} LoggerOptions
 * @property {string} [level] Minimum level to print. One of {@link LEVEL_NAMES}. Defaults to `info`.
 * @property {string} [scope] Label printed before every message, e.g. `Commands`.
 * @property {NodeJS.WritableStream} [stream] Where messages are written. Defaults to stdout, so every
 *   level stays in order when Docker, PM2 or a hosting panel collects the output.
 * @property {boolean} [colors] Force colours on or off. Detected from the stream when omitted.
 * @property {() => Date} [now] Clock used for timestamps. Useful in tests.
 */

/**
 * @typedef {object} SharedState
 * @property {number} level
 * @property {NodeJS.WritableStream} stream
 * @property {boolean} colors
 * @property {() => Date} now
 */

/**
 * A small, dependency-free console logger with levels, scopes and colours.
 *
 * Child loggers created with {@link Logger#child} share their parent's level, so calling
 * {@link Logger#setLevel} on the root logger affects every scoped logger in the app.
 */
class Logger {
	/** @type {SharedState} */
	#shared;

	/** @type {string | undefined} */
	#scope;

	/**
	 * @param {LoggerOptions} [options]
	 * @param {SharedState} [shared] Internal: state shared with a parent logger.
	 */
	constructor(options = {}, shared = undefined) {
		this.#scope = options.scope;

		if (shared) {
			this.#shared = shared;
			return;
		}

		const stream = options.stream ?? process.stdout;
		this.#shared = {
			level: LEVELS.info,
			stream,
			colors: options.colors ?? supportsColor(stream),
			now: options.now ?? (() => new Date()),
		};
		this.setLevel(options.level ?? 'info');
	}

	/** The name of the active minimum level. */
	get level() {
		return LEVEL_NAMES.find((name) => LEVELS[name] === this.#shared.level) ?? 'info';
	}

	/**
	 * Changes the minimum level for this logger and every logger that shares its state.
	 *
	 * @param {string} level One of {@link LEVEL_NAMES}.
	 */
	setLevel(level) {
		const normalised = String(level).toLowerCase();
		if (!LEVEL_NAMES.includes(normalised)) {
			throw new RangeError(`Unknown log level "${level}". Expected one of: ${LEVEL_NAMES.join(', ')}.`);
		}
		this.#shared.level = LEVELS[normalised];
	}

	/**
	 * Creates a logger that prefixes every message with `[scope]` and shares this logger's level.
	 *
	 * @param {string} scope
	 * @returns {Logger}
	 */
	child(scope) {
		return new Logger({ scope }, this.#shared);
	}

	/** @param {...unknown} args */
	debug(...args) {
		this.#write('debug', args);
	}

	/** @param {...unknown} args */
	info(...args) {
		this.#write('info', args);
	}

	/** @param {...unknown} args */
	success(...args) {
		this.#write('success', args);
	}

	/** @param {...unknown} args */
	warn(...args) {
		this.#write('warn', args);
	}

	/** @param {...unknown} args */
	error(...args) {
		this.#write('error', args);
	}

	/**
	 * @param {keyof typeof LEVEL_STYLES} level
	 * @param {unknown[]} args
	 */
	#write(level, args) {
		if (LEVELS[level] < this.#shared.level) return;

		const { stream, colors } = this.#shared;
		const paint = (color, text) => (colors ? `${color}${text}${ANSI.reset}` : text);

		const { label, color } = LEVEL_STYLES[level];
		const parts = [paint(ANSI.dim, formatTimestamp(this.#shared.now())), paint(color, label.padEnd(LABEL_WIDTH))];
		if (this.#scope) parts.push(paint(ANSI.pink, `[${this.#scope}]`));

		const message = formatWithOptions({ colors }, ...args);
		stream.write(`${parts.join(' ')} ${message}\n`);
	}
}

/**
 * The application-wide logger. Its level is set from `LOG_LEVEL` once the environment is loaded.
 * Use `logger.child('Scope')` to label messages coming from a module.
 */
const logger = new Logger();

module.exports = { logger, Logger, LEVEL_NAMES, ANSI, supportsColor, formatTimestamp };
