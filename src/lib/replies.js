const { MessageFlags } = require('discord.js');

async function replyEphemeral(interaction, options) {
	// After deferReply() the reply already exists ("is thinking..."), so fill it in instead.
	if (interaction.deferred && !interaction.replied) return interaction.editReply(options);

	const payload = { ...options, flags: MessageFlags.Ephemeral };
	// Once an interaction has been answered, more replies have to be follow-ups.
	if (interaction.replied) return interaction.followUp(payload);
	return interaction.reply(payload);
}

module.exports = { replyEphemeral };
