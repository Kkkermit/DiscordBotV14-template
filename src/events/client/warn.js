const { Events } = require('discord.js');
const { logger } = require('../../lib/logger');

const log = logger.child('Client');

module.exports = {
	name: Events.Warn,
	execute(message) {
		log.warn(message);
	},
};
