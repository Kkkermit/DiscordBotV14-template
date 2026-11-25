'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { MessageFlags } = require('discord.js');
const interactionCreate = require('../src/events/interactions/interactionCreate');
const { DEVELOPER_ID, createClient, createInteraction } = require('./helpers/fakes');

/** Adds a temporary slash command to the client. */
function addCommand(client, name, command) {
	client.slashCommands.set(name, {
		data: { name, toJSON: () => ({ name }) },
		category: 'Test',
		filePath: 'Test/test.js',
		...command,
	});
}

const noticeOf = (payload) => payload?.embeds?.[0]?.data.description;

describe('interactionCreate (slash commands)', () => {
	it('runs the matching command', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		let ran = false;
		addCommand(client, 'test', { execute: async () => (ran = true) });

		await interactionCreate.execute(createInteraction('test'), client);
		assert.equal(ran, true);
	});

	it('answers unknown commands with an ephemeral notice', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const interaction = createInteraction('removed');

		await interactionCreate.execute(interaction, client);
		assert.equal(interaction.replies[0].flags, MessageFlags.Ephemeral);
		assert.match(noticeOf(interaction.replies[0]), /no longer available/);
	});

	it('blocks developer-only commands for everyone else', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		let runs = 0;
		addCommand(client, 'secret', { developerOnly: true, execute: async () => (runs += 1) });

		const interaction = createInteraction('secret');
		await interactionCreate.execute(interaction, client);
		await interactionCreate.execute(createInteraction('secret', { userId: DEVELOPER_ID }), client);

		assert.equal(runs, 1);
		assert.equal(noticeOf(interaction.replies[0]), client.config.messages.developerOnly);
	});

	it('applies cooldowns', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		let runs = 0;
		addCommand(client, 'slow', { cooldown: 60, execute: async () => (runs += 1) });

		await interactionCreate.execute(createInteraction('slow'), client);
		const second = createInteraction('slow');
		await interactionCreate.execute(second, client);

		assert.equal(runs, 1);
		assert.match(noticeOf(second.replies[0]), /again <t:\d+:R>/);
	});

	it('uses followUp for errors after the command already replied', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		addCommand(client, 'half', {
			execute: async (interaction) => {
				await interaction.reply({ content: 'Working...' });
				throw new Error('boom');
			},
		});

		const interaction = createInteraction('half');
		await interactionCreate.execute(interaction, client);
		assert.equal(interaction.followUps.length, 1);
		assert.equal(interaction.followUps[0].flags, MessageFlags.Ephemeral);
		assert.equal(noticeOf(interaction.followUps[0]), client.config.messages.error);
	});

	it('routes autocomplete and recovers from autocomplete errors', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		addCommand(client, 'broken', {
			execute: async () => {},
			autocomplete: async () => {
				throw new Error('boom');
			},
		});

		const interaction = createInteraction('broken');
		interaction.autocomplete = true;
		await interactionCreate.execute(interaction, client);
		assert.deepEqual(interaction.responses, [[]]);
	});
});
