'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { CooldownManager } = require('../../src/lib/cooldowns');

describe('CooldownManager', () => {
	it('allows the first use and blocks repeats until the cooldown ends', () => {
		const cooldowns = new CooldownManager();
		assert.equal(cooldowns.consume('slash:ping', 'user', 5_000, 0), 0);
		assert.equal(cooldowns.consume('slash:ping', 'user', 5_000, 1_000), 4_000);
		assert.equal(cooldowns.consume('slash:ping', 'user', 5_000, 5_000), 0);
	});

	it('tracks users and commands separately', () => {
		const cooldowns = new CooldownManager();
		cooldowns.consume('slash:ping', 'a', 5_000, 0);
		assert.equal(cooldowns.consume('slash:ping', 'b', 5_000, 0), 0);
		assert.equal(cooldowns.consume('prefix:ping', 'a', 5_000, 0), 0);
	});

	it('ignores zero or negative durations', () => {
		const cooldowns = new CooldownManager();
		assert.equal(cooldowns.consume('slash:ping', 'user', 0, 0), 0);
		assert.equal(cooldowns.consume('slash:ping', 'user', 0, 0), 0);
		assert.equal(cooldowns.size, 0);
	});

	it('sweeps expired entries only', () => {
		const cooldowns = new CooldownManager();
		cooldowns.consume('a', 'user', 1_000, 0);
		cooldowns.consume('b', 'user', 10_000, 0);
		assert.equal(cooldowns.sweep(5_000), 1);
		assert.equal(cooldowns.size, 1);
	});
});
