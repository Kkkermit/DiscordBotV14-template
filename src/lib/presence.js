const { logger } = require('./logger');

const log = logger.child('Presence');

function resolveActivity(activity, client) {
	const name = typeof activity.name === 'function' ? activity.name(client) : activity.name;
	return { type: activity.type, name: String(name) };
}

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
	clearInterval(client.presenceTimer);
	if (activities.length > 1 && rotateIntervalSeconds > 0) {
		client.presenceTimer = setInterval(() => {
			index += 1;
			apply();
		}, rotateIntervalSeconds * 1000).unref();
	}

	log.success(`Status set to "${status}".`);
}

module.exports = { startPresenceRotation };
