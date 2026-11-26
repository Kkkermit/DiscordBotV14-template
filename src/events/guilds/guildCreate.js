const { Events } = require('discord.js');
const { logger } = require('../../lib/logger');

const log = logger.child('Guilds');

module.exports = {
	name: Events.GuildCreate,
	execute(guild, client) {
		log.info(
			`Joined "${guild.name}" (${guild.id}), owner ${guild.ownerId}, ${guild.memberCount} member(s). ` +
				`Now in ${client.guilds.cache.size} server(s).`,
		);
	},
};
