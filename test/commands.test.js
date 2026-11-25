'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { ComponentType } = require('discord.js');
const { USER_ID, createClient, createInteraction, createMessage, createUser } = require('./helpers/fakes');

/**
 * Runs the real command files against fake Discord objects. Building the embeds also runs
 * discord.js's own validation (field lengths, empty values...), so broken output fails here.
 */

const embedOf = (payload) => payload.embeds[0].data;

describe('slash commands', () => {
	it('/ping reports the latency', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const interaction = createInteraction('ping');

		await client.slashCommands.get('ping').execute(interaction, client);
		assert.equal(embedOf(interaction.edits[0]).title, '🏓 Pong!');
	});

	it('/uptime shows the uptime', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const interaction = createInteraction('uptime');

		await client.slashCommands.get('uptime').execute(interaction, client);
		assert.equal(embedOf(interaction.replies[0]).fields[0].value, '`1m 30s`');
	});

	it('/help lists every category and shows command details', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const help = client.slashCommands.get('help');

		const list = createInteraction('help');
		await help.execute(list, client);
		assert.deepEqual(
			embedOf(list.replies[0]).fields.map(({ name }) => name),
			['Info', 'Utility'],
		);

		const detail = createInteraction('help', { options: { command: 'user-info' } });
		await help.execute(detail, client);
		assert.equal(embedOf(detail.replies[0]).title, 'Command: user-info');

		const missing = createInteraction('help', { options: { command: 'nope' } });
		await help.execute(missing, client);
		assert.match(missing.replies[0].content, /no command called `nope`/);
	});

	it('/help hides developer-only commands and suggests names while typing', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		client.slashCommands.set('secret', { ...client.slashCommands.get('ping'), developerOnly: true });

		const interaction = createInteraction('help', { focused: 'e' });
		await client.slashCommands.get('help').autocomplete(interaction, client);
		const names = interaction.responses[0].map(({ name }) => name);
		assert.deepEqual(
			names,
			['bot-info', 'help', 'ping', 'uptime', 'user-info'].filter((name) => name.includes('e')),
		);
	});

	it('/help finds context menu commands regardless of case', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const { ApplicationCommandType, ContextMenuCommandBuilder } = require('discord.js');
		client.slashCommands.set('Avatar', {
			data: new ContextMenuCommandBuilder().setName('Avatar').setType(ApplicationCommandType.User),
			execute: async () => {},
			category: 'Info',
			filePath: 'Info/avatar.js',
		});
		const help = client.slashCommands.get('help');

		const typing = createInteraction('help', { focused: 'av' });
		await help.autocomplete(typing, client);
		assert.deepEqual(typing.responses[0], [{ name: 'Avatar', value: 'Avatar' }]);

		const detail = createInteraction('help', { options: { command: 'Avatar' } });
		await help.execute(detail, client);
		assert.equal(embedOf(detail.replies[0]).title, 'Command: Avatar');
		assert.match(embedOf(detail.replies[0]).fields[0].value, /right-click menu/);
	});

	it('/bot-info can only be refreshed by the user who ran it', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const interaction = createInteraction('bot-info');

		await client.slashCommands.get('bot-info').execute(interaction, client);
		assert.equal(embedOf(interaction.replies[0]).author.name, 'TemplateBot information');

		const { collector } = interaction.sentMessage;
		const replies = [];
		const updates = [];
		const click = (userId) => ({
			customId: 'bot-info:refresh',
			user: { id: userId },
			reply: async (payload) => replies.push(payload),
			update: async (payload) => updates.push(payload),
		});

		collector.emit('collect', click('someone-else'));
		collector.emit('collect', click(USER_ID));
		collector.emit('end');
		await new Promise(setImmediate);

		assert.equal(replies.length, 1);
		assert.equal(updates.length, 1);
		const [row] = interaction.edits[0].components;
		assert.equal(row.components[0].data.type, ComponentType.Button);
		assert.equal(row.components[0].data.disabled, true);
	});

	it('/user-info describes the requested user', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const target = createUser('100000000000000009', 'someone');
		const interaction = createInteraction('user-info', { options: { user: target } });

		await client.slashCommands.get('user-info').execute(interaction, client);
		assert.equal(embedOf(interaction.replies[0]).author.name, 'someone');
		assert.deepEqual(interaction.replies[0].allowedMentions, { parse: [] });
	});
});

describe('prefix commands', () => {
	for (const name of ['ping', 'uptime', 'help', 'bot-info']) {
		it(`${name} replies with an embed`, async (t) => {
			const client = createClient();
			t.after(() => client.destroy());
			const message = createMessage(`?${name}`);

			await client.prefixCommands.get(name).execute(message, client, []);
			assert.ok(message.replies.length > 0, 'no reply was sent');
		});
	}

	it('help shows the details of a command by alias', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const message = createMessage('?help bi');

		await client.prefixCommands.get('help').execute(message, client, ['bi']);
		const embed = embedOf(message.replies[0]);
		assert.equal(embed.title, 'Command: bot-info');
		assert.ok(embed.fields.some(({ name, value }) => name === 'Aliases' && value.includes('`bi`')));
	});
});
