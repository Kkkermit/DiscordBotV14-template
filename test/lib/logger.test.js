const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { styleText } = require('node:util');
const { Logger, formatTimestamp, supportsColor } = require('../../src/lib/logger');

function createStream() {
	const output = { text: '' };
	return { output, stream: { write: (chunk) => (output.text += chunk) } };
}

const FIXED_DATE = new Date(2026, 0, 2, 3, 4, 5);

describe('Logger', () => {
	it('prints a timestamp, level and scope without colours', () => {
		const { output, stream } = createStream();
		const logger = new Logger({ stream, colors: false, now: () => FIXED_DATE });
		logger.child('Commands').info('Loaded', 3, 'commands');
		assert.equal(output.text, '2026-01-02 03:04:05 INFO    [Commands] Loaded 3 commands\n');
	});

	it('writes every level to the same stream, in order', () => {
		const { output, stream } = createStream();
		const log = new Logger({ stream, colors: false }).child('Test');
		log.info('first');
		log.error('second');
		log.warn('third');
		assert.match(output.text, /INFO {4}\[Test\] first\n.*ERROR {3}\[Test\] second\n.*WARN {4}\[Test\] third\n/s);
	});

	it('adds colours when enabled', () => {
		const { output, stream } = createStream();
		new Logger({ stream, colors: true }).child('Test').error('broken');
		assert.ok(output.text.includes(styleText('red', 'ERROR'.padEnd(7), { validateStream: false })));
	});

	it('includes the stack of errors passed as extra arguments', () => {
		const { output, stream } = createStream();
		const log = new Logger({ stream, colors: false }).child('Test');
		log.error('Something failed:', new Error('boom'));
		assert.match(output.text, /Something failed: Error: boom\n\s+at /);
	});

	it('filters messages below the level, shared with child loggers', () => {
		const { output, stream } = createStream();
		const logger = new Logger({ stream, colors: false });
		const child = logger.child('Child');
		child.debug('hidden');
		logger.setLevel('debug');
		child.debug('visible');
		logger.setLevel('error');
		child.success('hidden too');
		assert.doesNotMatch(output.text, /hidden/);
		assert.match(output.text, /visible/);
		assert.equal(logger.level, 'error');
	});

	it('rejects unknown levels', () => {
		assert.throws(() => new Logger({ level: 'verbose' }), RangeError);
	});
});

describe('supportsColor', () => {
	const tty = { isTTY: true, hasColors: () => true };

	it('respects NO_COLOR and FORCE_COLOR', () => {
		assert.equal(supportsColor(tty, { NO_COLOR: '1' }), false);
		assert.equal(supportsColor({}, { FORCE_COLOR: '1' }), true);
		assert.equal(supportsColor(tty, { FORCE_COLOR: '0' }), false);
	});

	it('detects terminals', () => {
		assert.equal(supportsColor(tty, {}), true);
		assert.equal(supportsColor({ isTTY: false }, {}), false);
	});
});

describe('formatTimestamp', () => {
	it('zero-pads every part', () => {
		assert.equal(formatTimestamp(FIXED_DATE), '2026-01-02 03:04:05');
	});
});
