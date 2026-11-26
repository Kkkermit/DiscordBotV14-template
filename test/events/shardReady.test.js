const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const shardReady = require('../../src/events/client/shardReady');
const { createClient } = require('../helpers/fakes');

describe('shardReady', () => {
	it('sets the presence every time a connection is ready', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const updates = [];
		client.user.setPresence = (data) => updates.push(data);

		// Discord forgets the status after a new session, so a second "ready" must set it again.
		await shardReady.execute(0, new Set(), client);
		await shardReady.execute(0, new Set(), client);
		assert.equal(updates.length, 2);
		assert.equal(updates[1].status, client.config.presence.status);
	});
});
