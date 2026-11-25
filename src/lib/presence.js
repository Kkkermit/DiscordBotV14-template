'use strict';

const { logger } = require('./logger');

const log = logger.child('Presence');

/**
 * Turns a configured activity into the shape discord.js expects, evaluating `name` when it's a function.
 *
 * @param {{ type: import('discord.js').ActivityType, name: string | ((client: import('../client').BotClient) => string) }} activity
 * @param {import('../client').BotClient} client
 * @returns {import('discord.js').ActivitiesOptions}
 */
function resolveActivity(activity, client) {
	const name = typeof activity.name === 'function' ? activity.name(client) : activity.name;
	return { type: activity.type, name: String(name) };
}

/**
 * Sets the bot's status and starts rotating through `config.presence.activities`.
 * The timer is stored on `client.presenceTimer` and cleared when the client is destroyed.
 *
 * @param {import('../client').BotClient} client
 */
function startPresenceRotation(client) {
	const { status, activities, rotateIntervalSeconds } = client.config.presence;
	let index = 0;

	const apply = () => {
		try {
			const activity =
				activities.length > 0 ? [resolveActivity(activities[index % activities.length], client)] : [];
			client.user.setPresence({ status, activities: activity });
		} catch (error) {
			log.error('Could not update the presence:', error);
		}
	};

	apply();
	clearInterval(client.presenceTimer ?? undefined);
	client.presenceTimer = null;

	if (activities.length > 1 && rotateIntervalSeconds > 0) {
		client.presenceTimer = setInterval(() => {
			index += 1;
			apply();
		}, rotateIntervalSeconds * 1000).unref();
	}

	log.success(`Status set to "${status}" with ${activities.length} activit${activities.length === 1 ? 'y' : 'ies'}.`);
}

module.exports = { resolveActivity, startPresenceRotation };
