const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const mention = require('../../src/events/messages/mention');
const { BOT_ID, createClient, createMessage } = require('../helpers/fakes');

describe('mention', () => {
	it('introduces the bot when a message is only a mention of it', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());

		for (const content of [`<@${BOT_ID}>`, `  <@!${BOT_ID}>  `]) {
			const message = createMessage(content);
			await mention.execute(message, client);
			assert.match(message.replies[0].embeds[0].data.description, /\?help/);
		}
	});

	it('stays quiet when the mention is part of a longer message or from a bot', async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const chat = createMessage(`<@${BOT_ID}> how are you?`);
		const fromBot = createMessage(`<@${BOT_ID}>`);
		fromBot.author.bot = true;

		await mention.execute(chat, client);
		await mention.execute(fromBot, client);
		assert.equal(chat.replies.length + fromBot.replies.length, 0);
	});
});
