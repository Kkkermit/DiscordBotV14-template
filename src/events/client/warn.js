'use strict';

const { Events } = require('discord.js');
const { logger } = require('../../lib/logger');

const log = logger.child('Client');

/** @type {import('../../types').BotEvent} */
module.exports = {
	name: Events.Warn,
	/** @param {string} message */
	execute(message) {
		log.warn(message);
	},
};
