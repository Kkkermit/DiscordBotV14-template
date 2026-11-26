const { formatWithOptions, styleText } = require('node:util');

const LEVEL_NAMES = ['debug', 'info', 'warn', 'error'];

// `success` is printed at the same level as `info`.
const SEVERITY = { debug: 0, info: 1, success: 1, warn: 2, error: 3 };
const LEVEL_COLORS = { debug: 'blue', info: 'cyan', success: 'green', warn: 'yellow', error: 'red' };
const LABEL_WIDTH = 'SUCCESS'.length;

function supportsColor(stream, env = process.env) {
	if (env.NO_COLOR) return false;
	if (env.FORCE_COLOR !== undefined) return env.FORCE_COLOR !== '0' && env.FORCE_COLOR !== 'false';
	return Boolean(stream.isTTY && stream.hasColors?.());
}

function colorize(style, text, enabled) {
	// supportsColor() already decided, so styleText shouldn't check again.
	return enabled ? styleText(style, text, { validateStream: false }) : text;
}

function formatTimestamp(date) {
	const pad = (value) => String(value).padStart(2, '0');
	const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
	const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
	return `${day} ${time}`;
}

class Logger {
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

	setLevel(level) {
		const name = String(level).toLowerCase();
		if (!LEVEL_NAMES.includes(name)) {
			throw new RangeError(`Unknown log level "${level}". Use one of: ${LEVEL_NAMES.join(', ')}.`);
		}
		this.level = name;
	}

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

	write(level, label, args) {
		if (SEVERITY[level] < SEVERITY[this.level]) return;

		const parts = [
			colorize('dim', formatTimestamp(this.now()), this.colors),
			colorize(LEVEL_COLORS[level], level.toUpperCase().padEnd(LABEL_WIDTH), this.colors),
		];
		if (label) parts.push(colorize('magenta', `[${label}]`, this.colors));
		parts.push(formatWithOptions({ colors: this.colors }, ...args));

		this.stream.write(`${parts.join(' ')}\n`);
	}
}

const logger = new Logger();

module.exports = { logger, Logger, LEVEL_NAMES, supportsColor, colorize, formatTimestamp };
