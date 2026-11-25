'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { escapeCodeBlock, formatDuration, formatMessage, joinLines, truncate } = require('../src/lib/format');

describe('formatDuration', () => {
	it('drops leading zero units but keeps the ones after the first non-zero unit', () => {
		assert.equal(formatDuration(0), '0s');
		assert.equal(formatDuration(5_000), '5s');
		assert.equal(formatDuration(65_000), '1m 5s');
		assert.equal(formatDuration(3_600_000), '1h 0m 0s');
		assert.equal(formatDuration(90_061_000), '1d 1h 1m 1s');
	});

	it('handles invalid and negative input', () => {
		assert.equal(formatDuration(null), '0s');
		assert.equal(formatDuration(-1_000), '0s');
		assert.equal(formatDuration(Number.NaN), '0s');
	});
});

describe('truncate', () => {
	it('returns short text unchanged', () => {
		assert.equal(truncate('hello', 5), 'hello');
	});

	it('cuts long text and adds an ellipsis within the limit', () => {
		const result = truncate('hello world', 6);
		assert.equal(result, 'hello…');
		assert.equal(result.length, 6);
	});
});

describe('formatMessage', () => {
	it('replaces known placeholders and keeps unknown ones', () => {
		assert.equal(formatMessage('Use {prefix}help, {name}!', { prefix: '?' }), 'Use ?help, {name}!');
	});

	it('does not read inherited properties', () => {
		assert.equal(formatMessage('{toString}', {}), '{toString}');
	});
});

describe('joinLines', () => {
	it('keeps every line when they fit', () => {
		assert.equal(joinLines(['a', 'b', 'c'], 100), 'a\nb\nc');
	});

	it('drops whole lines and says how many were left out', () => {
		const lines = Array.from({ length: 50 }, (_, index) => `line number ${index}`);
		const result = joinLines(lines, 100);
		assert.ok(result.length <= 100);
		assert.match(result, /^line number 0\n/);
		assert.match(result, /\n…and \d+ more$/);
		assert.ok(
			result
				.split('\n')
				.slice(0, -1)
				.every((line) => lines.includes(line)),
			'a line was cut in half',
		);
	});
});

describe('escapeCodeBlock', () => {
	it('stops user input from closing a code block, whatever the number of backticks', () => {
		for (const input of ['a ``` b', '````', '``````````', '`` ` ``']) {
			assert.ok(!escapeCodeBlock(input).includes('``'), `${input} still contains backticks in a row`);
		}
	});
});
