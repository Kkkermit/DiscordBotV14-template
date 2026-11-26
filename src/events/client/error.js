const { Events } = require('discord.js');
const { logger } = require('../../lib/logger');

const log = logger.child('Client');

// Without a listener for this event, Node.js would crash the bot on a client error.
module.exports = {
	name: Events.Error,
	execute(error) {
		log.error('Discord client error:', error);
	},
};
