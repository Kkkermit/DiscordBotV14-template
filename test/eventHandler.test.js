'use strict';

const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const { loadEvents, validateEvent } = require('../src/handlers/eventHandler');
require('./helpers/fakes'); // Silences the logger.

describe('validateEvent', () => {
	it('accepts a valid event and explains invalid ones', () => {
		assert.equal(validateEvent({ name: 'messageCreate', execute() {} }), null);
		assert.match(validateEvent({ execute() {} }), /"name"/);
		assert.match(validateEvent({ name: 'x' }), /"execute"/);
		assert.match(validateEvent({ name: 'x', execute() {}, once: 'yes' }), /"once"/);
	});
});

describe('loadEvents', () => {
	it('registers the bundled events', () => {
		const client = new EventEmitter();
		assert.equal(loadEvents(client), 8);
		assert.equal(client.listenerCount('messageCreate'), 2);
		assert.equal(client.listenerCount('clientReady'), 1);
		assert.equal(client.listenerCount('error'), 1);
	});

	it('passes the client last and catches errors thrown by events', async (t) => {
		const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'events-'));
		t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
		fs.writeFileSync(
			path.join(directory, 'throws.js'),
			`module.exports = { name: 'custom', async execute(value, client) { client.received = value; throw new Error('boom'); } };`,
		);

		const client = new EventEmitter();
		assert.equal(loadEvents(client, directory), 1);

		const [listener] = client.listeners('custom');
		await assert.doesNotReject(listener('payload'));
		assert.equal(client.received, 'payload');
	});
});
