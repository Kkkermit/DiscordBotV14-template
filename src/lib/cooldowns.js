const { time, TimestampStyles } = require('discord.js');
const { formatMessage } = require('./format');

/**
 * Tracks per-user command cooldowns.
 *
 * Expired entries are ignored straight away and removed from memory by {@link CooldownManager#sweep},
 * which the client calls on an interval.
 */
class CooldownManager {
	/** @type {Map<string, number>} `commandKey:userId` → timestamp (ms) when the cooldown ends. */
	#expiries = new Map();

	/**
	 * Starts a cooldown for a user, unless one is already running.
	 *
	 * @param {string} commandKey Unique key for the command, e.g. `slash:ping`.
	 * @param {string} userId
	 * @param {number} durationMs Length of the cooldown. `0` or less disables it.
	 * @param {number} [now] Current time in ms. Useful for tests.
	 * @returns {number} `0` if the command may run, otherwise the milliseconds left on the cooldown.
	 */
	consume(commandKey, userId, durationMs, now = Date.now()) {
		if (durationMs <= 0) return 0;

		const key = `${commandKey}:${userId}`;
		const expiresAt = this.#expiries.get(key);
		if (expiresAt !== undefined && expiresAt > now) return expiresAt - now;

		this.#expiries.set(key, now + durationMs);
		return 0;
	}

	/**
	 * Removes every expired cooldown from memory.
	 *
	 * @param {number} [now]
	 * @returns {number} How many entries were removed.
	 */
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

	/** Number of cooldowns currently stored (including expired ones not yet swept). */
	get size() {
		return this.#expiries.size;
	}
}

/**
 * Starts a command's cooldown for a user, or returns the message to show if it is still running.
 *
 * @param {import('../client').BotClient} client
 * @param {string} commandKey Unique per command, e.g. `slash:ping`.
 * @param {string} userId
 * @param {number} [seconds] The command's `cooldown`. Defaults to `commands.defaultCooldownSeconds`.
 * @returns {string | null} The cooldown message, or `null` if the command may run.
 */
function checkCooldown(client, commandKey, userId, seconds = client.config.commands.defaultCooldownSeconds) {
	const remainingMs = client.cooldowns.consume(commandKey, userId, seconds * 1000);
	if (remainingMs === 0) return null;

	const availableAt = new Date(Date.now() + remainingMs);
	return formatMessage(client.config.messages.cooldown, { time: time(availableAt, TimestampStyles.RelativeTime) });
}

module.exports = { CooldownManager, checkCooldown };
