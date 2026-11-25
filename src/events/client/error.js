'use strict';

const { Events } = require('discord.js');
const { logger } = require('../../lib/logger');

const log = logger.child('Client');

/**
 * Logs errors emitted by the discord.js client. Without a listener for this event,
 * Node.js would treat these errors as uncaught and stop the bot.
 *
 * @type {import('../../types').BotEvent}
 */
module.exports = {
	name: Events.Error,
	/** @param {Error} error */
	execute(error) {
		log.error('Discord client error:', error);
	},
};
