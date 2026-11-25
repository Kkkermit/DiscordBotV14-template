'use strict';

const { Events } = require('discord.js');
const { logger } = require('../../lib/logger');

const log = logger.child('Guilds');

/** @type {import('../../types').BotEvent} */
module.exports = {
	name: Events.GuildDelete,
	/**
	 * Fired when the bot is removed from a server (kicked, banned or the server was deleted).
	 * Temporary outages emit `guildUnavailable` instead.
	 *
	 * @param {import('discord.js').Guild} guild
	 * @param {import('../../client').BotClient} client
	 */
	execute(guild, client) {
		log.info(`Removed from "${guild.name}" (${guild.id}). Now in ${client.guilds.cache.size} server(s).`);
	},
};
