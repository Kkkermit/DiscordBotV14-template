'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { DiscordAPIError } = require('discord.js');
const { createClient, createUser } = require('../helpers/fakes');

// The logger remembers channels that failed, so every test loads a fresh copy of the module.
function loadCommandLogger() {
	delete require.cache[require.resolve('../../src/lib/commandLogger')];
	return require('../../src/lib/commandLogger');
}

/** A client whose log channel records what is sent to it. */
function createLoggingClient(t, channel) {
	const client = createClient();
	t.after(() => client.destroy());
	client.config = { ...client.config, logging: { commandLogChannelId: '100000000000000020' } };
	client.channels.fetch = async () => channel;
	return client;
}

const usage = { type: 'prefix', command: '?ping', user: createUser('100000000000000002'), guild: null };

describe('logCommandUsage', () => {
	it('posts an embed in the log channel with mentions disabled', async (t) => {
		const sent = [];
		const client = createLoggingClient(t, { isSendable: () => true, send: async (payload) => sent.push(payload) });

		await loadCommandLogger().logCommandUsage(client, { ...usage, command: '?say ```@everyone```' });
		assert.equal(sent.length, 1);
		assert.deepEqual(sent[0].allowedMentions, { parse: [] });
		const commandField = sent[0].embeds[0].data.fields[0].value;
		assert.equal(commandField.match(/```/g).length, 2, 'only the code block itself may contain ```');
	});

	it('stops trying after Discord rejects the channel', async (t) => {
		let attempts = 0;
		const client = createLoggingClient(t, {
			isSendable: () => true,
			send: async () => {
				attempts += 1;
				throw new DiscordAPIError({ code: 50013, message: 'Missing Permissions' }, 50013, 403, 'POST', '/', {});
			},
		});
		const { logCommandUsage } = loadCommandLogger();

		await logCommandUsage(client, usage);
		await logCommandUsage(client, usage);
		assert.equal(attempts, 1);
	});

	it('keeps trying after a network error, which may be temporary', async (t) => {
		let attempts = 0;
		const client = createLoggingClient(t, {
			isSendable: () => true,
			send: async () => {
				attempts += 1;
				throw new Error('socket hang up');
			},
		});
		const { logCommandUsage } = loadCommandLogger();

		await logCommandUsage(client, usage);
		await logCommandUsage(client, usage);
		assert.equal(attempts, 2);
	});

	it('does nothing when no log channel is configured', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		client.channels.fetch = async () => assert.fail('should not look up a channel');

		await loadCommandLogger().logCommandUsage(client, usage);
	});
});
