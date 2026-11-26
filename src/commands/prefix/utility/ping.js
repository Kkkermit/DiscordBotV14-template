const { createEmbed } = require('../../../lib/embeds');

/** @type {import('../../../types').PrefixCommand} */
module.exports = {
	name: 'ping',
	description: 'Check how fast the bot is responding.',
	aliases: ['latency'],
	cooldown: 5,

	async execute(message, client) {
		const reply = await message.reply('Pinging...');
		const roundTrip = reply.createdTimestamp - message.createdTimestamp;
		const websocket = client.ws.ping >= 0 ? `${Math.round(client.ws.ping)}ms` : 'measuring...';

		const embed = createEmbed(client)
			.setTitle('🏓 Pong!')
			.addFields(
				{ name: 'Round trip', value: `\`${roundTrip}ms\``, inline: true },
				{ name: 'WebSocket', value: `\`${websocket}\``, inline: true },
			);

		await reply.edit({ content: '', embeds: [embed] });
	},
};
