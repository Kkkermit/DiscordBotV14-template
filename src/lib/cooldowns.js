'use strict';

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
		if (!(durationMs > 0)) return 0;

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

module.exports = { CooldownManager };
