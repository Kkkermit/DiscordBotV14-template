'use strict';

const { Events } = require('discord.js');
const { logger } = require('../../lib/logger');

const log = logger.child('Guilds');

/** @type {import('../../types').BotEvent} */
module.exports = {
	name: Events.GuildCreate,
	/**
	 * @param {import('discord.js').Guild} guild The server the bot was added to.
	 * @param {import('../../client').BotClient} client
	 */
	execute(guild, client) {
		log.info(
			`Joined "${guild.name}" (${guild.id}), owner ${guild.ownerId}, ${guild.memberCount} member(s). ` +
				`Now in ${client.guilds.cache.size} server(s).`,
		);
	},
};
