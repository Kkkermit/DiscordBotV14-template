const { collectRefreshClicks, createBotInfoPayload } = require('../../../lib/botInfo');

/** @type {import('../../../types').PrefixCommand} */
module.exports = {
	name: 'bot-info',
	description: 'Show information and statistics about the bot.',
	aliases: ['bi', 'botinfo'],
	cooldown: 10,

	async execute(message, client) {
		const reply = await message.reply(createBotInfoPayload(client));

		collectRefreshClicks({
			message: reply,
			userId: message.author.id,
			client,
			edit: (payload) => reply.edit(payload),
		});
	},
};
