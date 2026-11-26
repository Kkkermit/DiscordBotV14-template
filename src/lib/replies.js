const { MessageFlags } = require('discord.js');

/**
 * Sends a reply only the user can see. Uses `followUp` when the interaction was already
 * answered or deferred, so it is safe to call from error handlers.
 *
 * @param {import('discord.js').RepliableInteraction} interaction
 * @param {Omit<import('discord.js').InteractionReplyOptions, 'flags'>} options
 */
async function replyEphemeral(interaction, options) {
	const payload = { ...options, flags: MessageFlags.Ephemeral };
	if (interaction.replied || interaction.deferred) return interaction.followUp(payload);
	return interaction.reply(payload);
}

module.exports = { replyEphemeral };
