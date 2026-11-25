'use strict';

const { ActivityType, resolveColor } = require('discord.js');
const { SNOWFLAKE_PATTERN } = require('./constants');

const PRESENCE_STATUSES = Object.freeze(['online', 'idle', 'dnd', 'invisible']);
const ACTIVITY_TYPES = new Set(Object.values(ActivityType).filter((value) => typeof value === 'number'));
const MIN_ROTATE_INTERVAL_SECONDS = 15;
const REPOSITORY_PATTERN = /^[\w.-]+\/[\w.-]+$/;

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

/**
 * Checks `src/config.js` for mistakes and returns a list of human-readable problems.
 * An empty array means the config is valid.
 *
 * @param {typeof import('../config')} config
 * @returns {string[]}
 */
function validateConfig(config) {
	const issues = [];

	if (!isNonEmptyString(config.prefix) || /\s/.test(config.prefix)) {
		issues.push('prefix must be a non-empty string without spaces.');
	}

	try {
		resolveColor(config.embedColor);
	} catch {
		issues.push(`embedColor "${config.embedColor}" is not a valid colour name or hex number.`);
	}

	if (!isNonEmptyString(config.developerName)) {
		issues.push('developerName must be a non-empty string.');
	}

	const { presence, commands, logging, updateCheck, messages } = config;

	if (!isPlainObject(presence)) {
		issues.push('presence must be an object.');
	} else {
		if (!PRESENCE_STATUSES.includes(presence.status)) {
			issues.push(`presence.status must be one of: ${PRESENCE_STATUSES.join(', ')}.`);
		}
		const interval = presence.rotateIntervalSeconds;
		if (!Number.isFinite(interval) || (interval !== 0 && interval < MIN_ROTATE_INTERVAL_SECONDS)) {
			issues.push(`presence.rotateIntervalSeconds must be 0 or at least ${MIN_ROTATE_INTERVAL_SECONDS}.`);
		}
		if (!Array.isArray(presence.activities)) {
			issues.push('presence.activities must be an array.');
		} else {
			presence.activities.forEach((activity, index) => {
				if (!ACTIVITY_TYPES.has(activity?.type)) {
					issues.push(`presence.activities[${index}].type must be an ActivityType value.`);
				}
				if (!isNonEmptyString(activity?.name) && typeof activity?.name !== 'function') {
					issues.push(`presence.activities[${index}].name must be a string or a function.`);
				}
			});
		}
	}

	if (!isPlainObject(commands)) {
		issues.push('commands must be an object.');
	} else {
		for (const key of ['registerOnStartup', 'mentionAsPrefix', 'replyToUnknownCommands']) {
			if (typeof commands[key] !== 'boolean') issues.push(`commands.${key} must be true or false.`);
		}
		if (!Number.isFinite(commands.defaultCooldownSeconds) || commands.defaultCooldownSeconds < 0) {
			issues.push('commands.defaultCooldownSeconds must be a number greater than or equal to 0.');
		}
	}

	if (!isPlainObject(logging)) {
		issues.push('logging must be an object.');
	} else if (logging.commandLogChannelId && !SNOWFLAKE_PATTERN.test(logging.commandLogChannelId)) {
		issues.push('logging.commandLogChannelId must be empty or a channel ID (17-20 digits).');
	}

	if (!isPlainObject(updateCheck)) {
		issues.push('updateCheck must be an object.');
	} else {
		if (typeof updateCheck.enabled !== 'boolean') issues.push('updateCheck.enabled must be true or false.');
		if (updateCheck.enabled && !REPOSITORY_PATTERN.test(updateCheck.repository ?? '')) {
			issues.push('updateCheck.repository must look like "owner/name".');
		}
	}

	if (!isPlainObject(messages)) {
		issues.push('messages must be an object.');
	} else {
		for (const key of ['error', 'noPermission', 'developerOnly', 'cooldown', 'missingArgs', 'unknownCommand']) {
			if (!isNonEmptyString(messages[key])) issues.push(`messages.${key} must be a non-empty string.`);
		}
	}

	return issues;
}

module.exports = { validateConfig, PRESENCE_STATUSES, MIN_ROTATE_INTERVAL_SECONDS };
