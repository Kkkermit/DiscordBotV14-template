const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { MessageFlags } = require('discord.js');
const { replyEphemeral } = require('../../src/lib/replies');
const { createInteraction } = require('../helpers/fakes');

describe('replyEphemeral', () => {
	it('replies privately to a new interaction', async () => {
		const interaction = createInteraction('test');
		await replyEphemeral(interaction, { content: 'hi' });
		assert.deepEqual(interaction.replies, [{ content: 'hi', flags: MessageFlags.Ephemeral }]);
	});

	it('sends a private follow-up once the interaction was answered', async () => {
		const interaction = createInteraction('test');
		interaction.replied = true;
		await replyEphemeral(interaction, { content: 'hi' });
		assert.deepEqual(interaction.followUps, [{ content: 'hi', flags: MessageFlags.Ephemeral }]);
	});

	it('fills in the "thinking..." reply after deferReply()', async () => {
		const interaction = createInteraction('test');
		interaction.deferred = true;
		await replyEphemeral(interaction, { content: 'hi' });
		assert.deepEqual(interaction.edits, [{ content: 'hi' }]);
		assert.equal(interaction.followUps.length, 0);
	});
});
