const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ActivityType } = require('discord.js');
const { startPresenceRotation } = require('../../src/lib/presence');
const { createClient } = require('../helpers/fakes');

function createPresenceClient(t, presence) {
	const client = createClient();
	t.after(() => client.destroy());
	client.config = { ...client.config, presence };
	const updates = [];
	client.user.setPresence = (data) => updates.push(data);
	return { client, updates };
}

describe('startPresenceRotation', () => {
	it('shows the first activity straight away and rotates through the rest', (t) => {
		t.mock.timers.enable({ apis: ['setInterval'] });
		const { client, updates } = createPresenceClient(t, {
			status: 'idle',
			rotateIntervalSeconds: 30,
			activities: [
				{ type: ActivityType.Watching, name: (bot) => `${bot.slashCommands.size} commands` },
				{ type: ActivityType.Playing, name: 'with code' },
			],
		});

		startPresenceRotation(client);
		t.mock.timers.tick(30_000);
		t.mock.timers.tick(30_000);

		assert.deepEqual(
			updates.map(({ activities }) => activities[0].name),
			['5 commands', 'with code', '5 commands'],
		);
		assert.ok(updates.every(({ status }) => status === 'idle'));
	});

	it('does not rotate a single activity', (t) => {
		t.mock.timers.enable({ apis: ['setInterval'] });
		const { client, updates } = createPresenceClient(t, {
			status: 'online',
			rotateIntervalSeconds: 30,
			activities: [{ type: ActivityType.Playing, name: 'alone' }],
		});

		startPresenceRotation(client);
		t.mock.timers.tick(120_000);
		assert.equal(updates.length, 1);
		assert.equal(client.presenceTimer, null);
	});
});
