'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const ready = require('../src/events/client/ready');
const { createClient } = require('./helpers/fakes');

/** A client whose REST calls are recorded instead of sent to Discord. */
function createReadyClient(t) {
	const client = createClient();
	t.after(() => client.destroy());
	client.config = { ...client.config, banner: { enabled: false }, updateCheck: { enabled: false } };
	client.application = /** @type {any} */ ({ id: '100000000000000010' });

	// Replace only the two request methods, so the rest of the REST client (used by destroy()) still works.
	const calls = { put: [], get: 0 };
	client.rest.put = async (_route, { body }) => {
		calls.put.push(body);
		return body.map((command, index) => ({ ...command, id: `id-${index}`, type: command.type ?? 1 }));
	};
	client.rest.get = async () => {
		calls.get += 1;
		return [{ id: 'existing-ping', name: 'ping', type: 1 }];
	};
	return { client, calls };
}

describe('ready', () => {
	it('registers every slash command and remembers their IDs', async (t) => {
		const { client, calls } = createReadyClient(t);

		await ready.execute(client);
		assert.equal(calls.put.length, 1);
		assert.deepEqual(calls.put[0].map((command) => command.name).sort(), [...client.slashCommands.keys()].sort());
		assert.equal(client.commandIds.size, client.slashCommands.size);
	});

	it("does not overwrite Discord's commands while a command file is broken", async (t) => {
		const { client, calls } = createReadyClient(t);
		client.failedSlashCommandFiles = ['Utility/broken.js'];

		await ready.execute(client);
		assert.equal(calls.put.length, 0, 'registering would delete the broken command from Discord');
		assert.equal(calls.get, 1);
		assert.equal(client.commandIds.get('ping'), 'existing-ping');
	});
});
