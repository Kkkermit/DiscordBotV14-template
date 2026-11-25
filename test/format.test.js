'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { escapeCodeBlock, formatDuration, formatMessage, truncate } = require('../src/lib/format');

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

describe('escapeCodeBlock', () => {
	it('stops user input from closing a code block', () => {
		assert.ok(!escapeCodeBlock('a ``` b').includes('```'));
	});
});
