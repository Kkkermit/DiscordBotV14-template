const { time, TimestampStyles } = require('discord.js');
const { formatMessage } = require('./format');

class CooldownManager {
	#expiries = new Map();

	consume(commandKey, userId, durationMs, now = Date.now()) {
		if (durationMs <= 0) return 0;

		const key = `${commandKey}:${userId}`;
		const expiresAt = this.#expiries.get(key);
		if (expiresAt !== undefined && expiresAt > now) return expiresAt - now;

		this.#expiries.set(key, now + durationMs);
		return 0;
	}

	sweep(now = Date.now()) {
		let removed = 0;
		for (const [key, expiresAt] of this.#expiries) {
			if (expiresAt <= now) {
				this.#expiries.delete(key);
				removed += 1;
			}
		}
		return removed;
	}

	get size() {
		return this.#expiries.size;
	}
}

function checkCooldown(client, commandKey, userId, seconds = client.config.commands.defaultCooldownSeconds) {
	const remainingMs = client.cooldowns.consume(commandKey, userId, seconds * 1000);
	if (remainingMs === 0) return null;

	const availableAt = new Date(Date.now() + remainingMs);
	return formatMessage(client.config.messages.cooldown, { time: time(availableAt, TimestampStyles.RelativeTime) });
}

module.exports = { CooldownManager, checkCooldown };
