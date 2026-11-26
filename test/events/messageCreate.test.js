const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { PermissionFlagsBits } = require('discord.js');
const messageCreate = require('../../src/events/messages/messageCreate');
const { DEVELOPER_ID, createClient, createMessage } = require('../helpers/fakes');

function addCommand(client, command) {
	client.prefixCommands.set(command.name, { category: 'Test', filePath: 'Test/test.js', ...command });
}

const noticeOf = (message) => message.replies[0]?.embeds?.[0]?.data.description;

describe('messageCreate (prefix commands)', () => {
	it('runs a command with its arguments', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		let received;
		addCommand(client, { name: 'echo', execute: async (_message, _client, args) => (received = args) });

		await messageCreate.execute(createMessage('?ECHO hello world'), client);
		assert.deepEqual(received, ['hello', 'world']);
	});

	it('resolves aliases and mention prefixes', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const message = createMessage(`<@${client.user.id}> bi`);

		await messageCreate.execute(message, client);
		assert.equal(message.replies[0].embeds[0].data.author.name, 'TemplateBot information');
	});

	it('ignores bots, webhooks and messages without the prefix', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const fromBot = createMessage('?ping');
		fromBot.author.bot = true;
		const fromWebhook = createMessage('?ping');
		fromWebhook.webhookId = '1';
		const chat = createMessage('just chatting');

		for (const message of [fromBot, fromWebhook, chat]) await messageCreate.execute(message, client);
		assert.deepEqual(
			[fromBot, fromWebhook, chat].flatMap((message) => message.replies),
			[],
		);
	});

	it('replies to unknown commands only when enabled', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());

		const message = createMessage('?doesnotexist');
		await messageCreate.execute(message, client);
		assert.match(noticeOf(message), /does not exist.*\?help/);

		const chat = createMessage(`<@${client.user.id}> thanks!`);
		await messageCreate.execute(chat, client);
		assert.equal(chat.replies.length, 0, 'mentions should not get the unknown command hint');

		client.config = { ...client.config, commands: { ...client.config.commands, replyToUnknownCommands: false } };
		const quiet = createMessage('?doesnotexist');
		await messageCreate.execute(quiet, client);
		assert.equal(quiet.replies.length, 0);
	});

	it('does not answer chat that merely starts with the prefix', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());

		const messages = ['??', '?! really', '?? what', '?...'].map((content) => createMessage(content));
		for (const message of messages) await messageCreate.execute(message, client);
		assert.deepEqual(
			messages.flatMap((message) => message.replies),
			[],
		);
	});

	it('sends at most one notice per user every few seconds', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());

		const first = createMessage('?nope');
		const second = createMessage('?nope');
		await messageCreate.execute(first, client);
		await messageCreate.execute(second, client);
		assert.equal(first.replies.length, 1);
		assert.equal(second.replies.length, 0);
	});

	it('blocks developer-only commands for everyone else', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		let runs = 0;
		addCommand(client, { name: 'secret', developerOnly: true, execute: async () => (runs += 1) });

		const message = createMessage('?secret');
		await messageCreate.execute(message, client);
		assert.equal(runs, 0);
		assert.equal(noticeOf(message), client.config.messages.developerOnly);

		await messageCreate.execute(createMessage('?secret', { authorId: DEVELOPER_ID }), client);
		assert.equal(runs, 1);
	});

	it('checks member permissions and lists what is missing', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		let runs = 0;
		addCommand(client, {
			name: 'purge',
			permissions: [PermissionFlagsBits.ManageMessages],
			execute: async () => (runs += 1),
		});

		const denied = createMessage('?purge');
		await messageCreate.execute(denied, client);
		assert.match(noticeOf(denied), /Missing: ManageMessages/);

		await messageCreate.execute(
			createMessage('?purge', { permissions: [PermissionFlagsBits.ManageMessages] }),
			client,
		);
		assert.equal(runs, 1);
	});

	it('shows the usage when required arguments are missing', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		addCommand(client, { name: 'say', args: true, usage: '<text>', execute: async () => {} });

		const message = createMessage('?say');
		await messageCreate.execute(message, client);
		assert.match(noticeOf(message), /`\?say <text>`/);
	});

	it('applies cooldowns per user', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		let runs = 0;
		addCommand(client, { name: 'slow', cooldown: 60, execute: async () => (runs += 1) });

		await messageCreate.execute(createMessage('?slow'), client);
		const second = createMessage('?slow');
		await messageCreate.execute(second, client);
		await messageCreate.execute(createMessage('?slow', { authorId: DEVELOPER_ID }), client);

		assert.equal(runs, 2);
		assert.match(noticeOf(second), /Slow down! You can use this command again <t:\d+:R>\./);
	});

	it('replies with a generic error instead of crashing', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		addCommand(client, {
			name: 'broken',
			execute: async () => {
				throw new Error('secret internal details');
			},
		});

		const message = createMessage('?broken');
		await assert.doesNotReject(messageCreate.execute(message, client));
		assert.equal(noticeOf(message), client.config.messages.error);
	});
});
