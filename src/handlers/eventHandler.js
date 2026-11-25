'use strict';

const path = require('node:path');
const { Events } = require('discord.js');
const { findJsFiles } = require('../lib/files');
const { logger } = require('../lib/logger');

const log = logger.child('Events');

const EVENTS_DIR = path.join(__dirname, '..', 'events');
const KNOWN_EVENTS = new Set(Object.values(Events));

/**
 * Checks that a module exports a valid event.
 *
 * @param {unknown} event
 * @returns {string | null} The reason it is invalid, or `null` if it is valid.
 */
function validateEvent(event) {
	if (!event || typeof event !== 'object') return 'the file does not export an event object.';
	if (typeof event.name !== 'string' || event.name.length === 0) {
		return 'missing a "name". Use a value from the discord.js Events enum, e.g. Events.MessageCreate.';
	}
	if (typeof event.execute !== 'function') return 'missing an "execute" function.';
	if (event.once !== undefined && typeof event.once !== 'boolean') return '"once" must be true or false.';
	return null;
}

/**
 * Registers every event in `src/events` on the client.
 *
 * Each listener is wrapped so an error thrown by one event is logged with its file name
 * instead of becoming an unhandled promise rejection.
 *
 * @param {import('../client').BotClient} client
 * @param {string} [directory]
 * @returns {number} How many events were registered.
 */
function loadEvents(client, directory = EVENTS_DIR) {
	let registered = 0;

	for (const file of findJsFiles(directory)) {
		const relativePath = path.relative(directory, file);
		let event;
		try {
			event = require(file);
		} catch (error) {
			log.error(`Skipped event ${relativePath}:`, error);
			continue;
		}

		const problem = validateEvent(event);
		if (problem) {
			log.error(`Skipped event ${relativePath}: ${problem}`);
			continue;
		}
		if (!KNOWN_EVENTS.has(event.name)) {
			log.warn(`Event ${relativePath} listens to "${event.name}", which is not a discord.js client event.`);
		}

		const listener = async (...args) => {
			try {
				await event.execute(...args, client);
			} catch (error) {
				log.error(`Error in the "${event.name}" event (${relativePath}):`, error);
			}
		};

		if (event.once) client.once(event.name, listener);
		else client.on(event.name, listener);

		registered += 1;
		log.debug(`Registered ${relativePath} → ${event.name}${event.once ? ' (once)' : ''}`);
	}

	log.success(`Loaded ${registered} event(s).`);
	return registered;
}

module.exports = { EVENTS_DIR, validateEvent, loadEvents };
