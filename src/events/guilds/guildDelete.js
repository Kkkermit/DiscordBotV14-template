const { Events } = require('discord.js');
const { logger } = require('../../lib/logger');

const log = logger.child('Guilds');

module.exports = {
	name: Events.GuildDelete,
	execute(guild, client) {
		log.info(`Removed from "${guild.name}" (${guild.id}). Now in ${client.guilds.cache.size} server(s).`);
	},
};
