'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { registerProcessHandlers } = require('../../src/handlers/processHandler');
require('../helpers/fakes'); // Silences the logger.

const EVENTS = ['SIGINT', 'SIGTERM', 'unhandledRejection', 'uncaughtException'];

/** Registers the handlers with process.exit mocked, and removes them again after the test. */
function setUp(t, client) {
	const before = Object.fromEntries(EVENTS.map((event) => [event, process.listeners(event)]));
	const exit = t.mock.method(process, 'exit', () => {});
	t.after(() => {
		for (const event of EVENTS) {
			for (const listener of process.listeners(event)) {
				if (!before[event].includes(listener)) process.removeListener(event, listener);
			}
		}
	});
	return { exit, ...registerProcessHandlers(client) };
}

describe('registerProcessHandlers', () => {
	it('closes the client and exits with the given code', async (t) => {
		let destroyed = false;
		const { exit, shutdown } = setUp(t, { destroy: async () => (destroyed = true) });

		await shutdown('Test', 0);
		assert.equal(destroyed, true);
		assert.deepEqual(exit.mock.calls[0].arguments, [0]);
	});

	it('shuts down only once, even if asked twice', async (t) => {
		let destroyCount = 0;
		const { exit, shutdown } = setUp(t, { destroy: async () => (destroyCount += 1) });

		await Promise.all([shutdown('First'), shutdown('Second')]);
		assert.equal(destroyCount, 1);
		assert.equal(exit.mock.callCount(), 1);
	});

	it('exits with code 1 when closing fails', async (t) => {
		const { exit, shutdown } = setUp(t, {
			destroy: async () => {
				throw new Error('boom');
			},
		});

		await shutdown('Test', 0);
		assert.deepEqual(exit.mock.calls[0].arguments, [1]);
	});
});
