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

		const commandCount = `${client.slashCommands.size} commands`;
		assert.deepEqual(
			updates.map(({ activities }) => activities[0].name),
			[commandCount, 'with code', commandCount],
		);
		assert.ok(updates.every(({ status }) => status === 'idle'));
	});

	it('keeps a single activity up to date', (t) => {
		t.mock.timers.enable({ apis: ['setInterval'] });
		let servers = 1;
		const { client, updates } = createPresenceClient(t, {
			status: 'online',
			rotateIntervalSeconds: 30,
			activities: [{ type: ActivityType.Watching, name: () => `${servers} servers` }],
		});

		startPresenceRotation(client);
		servers = 2;
		t.mock.timers.tick(30_000);
		assert.deepEqual(
			updates.map(({ activities }) => activities[0].name),
			['1 servers', '2 servers'],
		);
	});

	it('keeps extra activity fields such as a streaming url', (t) => {
		const { client, updates } = createPresenceClient(t, {
			status: 'online',
			rotateIntervalSeconds: 0,
			activities: [{ type: ActivityType.Streaming, name: 'live', url: 'https://twitch.tv/example' }],
		});

		startPresenceRotation(client);
		assert.equal(updates[0].activities[0].url, 'https://twitch.tv/example');
		assert.equal(client.presenceTimer, null, 'an interval of 0 never updates');
	});
});
