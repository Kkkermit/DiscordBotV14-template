const { MessageFlags } = require('discord.js');

async function replyEphemeral(interaction, options) {
	const payload = { ...options, flags: MessageFlags.Ephemeral };
	// Once an interaction has been answered, more replies have to be follow-ups.
	if (interaction.replied || interaction.deferred) return interaction.followUp(payload);
	return interaction.reply(payload);
}

module.exports = { replyEphemeral };
