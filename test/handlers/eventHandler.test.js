const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { describe, it } = require('node:test');
const { EVENTS_DIR, loadEvents, validateEvent } = require('../../src/handlers/eventHandler');
const { findJsFiles } = require('../../src/lib/files');
require('../helpers/fakes'); // Silences the logger.

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
		const registered = loadEvents(client);
		const listeners = client.eventNames().reduce((total, name) => total + client.listenerCount(name), 0);
		assert.equal(registered, findJsFiles(EVENTS_DIR).length);
		assert.equal(listeners, registered);
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
