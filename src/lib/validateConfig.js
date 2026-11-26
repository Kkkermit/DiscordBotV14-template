const { ActivityType, resolveColor } = require('discord.js');
const figlet = require('figlet');
const { SNOWFLAKE_PATTERN } = require('./constants');

const PRESENCE_STATUSES = ['online', 'idle', 'dnd', 'invisible'];
const ACTIVITY_TYPES = Object.values(ActivityType).filter((value) => typeof value === 'number');
const FONTS = figlet.fontsSync();
const MESSAGE_KEYS = ['error', 'noPermission', 'developerOnly', 'cooldown', 'missingArgs', 'unknownCommand'];

/** Discord rate-limits presence updates, so activities can't change faster than this. */
const MIN_ROTATE_INTERVAL_SECONDS = 15;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';
const isBoolean = (value) => typeof value === 'boolean';

function isColor(value) {
	try {
		resolveColor(value);
		return true;
	} catch {
		return false;
	}
}

/**
 * Checks `src/config.js` for mistakes.
 *
 * @param {typeof import('../config')} config
 * @returns {string[]} A message for every problem found. Empty when the config is valid.
 */
function validateConfig(config) {
	const issues = [];
	const check = (isValid, message) => {
		if (!isValid) issues.push(message);
	};

	const { presence, commands, logging, updateCheck, messages } = config;

	check(isNonEmptyString(config.prefix) && !/\s/.test(config.prefix), 'prefix must be text without spaces.');
	check(isColor(config.embedColor), `embedColor "${config.embedColor}" is not a colour name or hex number.`);
	check(isNonEmptyString(config.developerName), 'developerName must not be empty.');
	check(isBoolean(config.banner?.enabled), 'banner.enabled must be true or false.');
	check(FONTS.includes(config.banner?.font), `banner.font "${config.banner?.font}" is not a figlet font.`);

	check(
		PRESENCE_STATUSES.includes(presence?.status),
		`presence.status must be one of: ${PRESENCE_STATUSES.join(', ')}.`,
	);
	const interval = presence?.rotateIntervalSeconds;
	check(
		interval === 0 || (Number.isFinite(interval) && interval >= MIN_ROTATE_INTERVAL_SECONDS),
		`presence.rotateIntervalSeconds must be 0 or at least ${MIN_ROTATE_INTERVAL_SECONDS}.`,
	);
	check(Array.isArray(presence?.activities), 'presence.activities must be a list.');
	(presence?.activities ?? []).forEach((activity, index) => {
		check(ACTIVITY_TYPES.includes(activity?.type), `presence.activities[${index}].type must be an ActivityType.`);
		check(
			isNonEmptyString(activity?.name) || typeof activity?.name === 'function',
			`presence.activities[${index}].name must be text or a function.`,
		);
	});

	check(isBoolean(commands?.registerOnStartup), 'commands.registerOnStartup must be true or false.');
	check(isBoolean(commands?.mentionAsPrefix), 'commands.mentionAsPrefix must be true or false.');
	check(isBoolean(commands?.replyToUnknownCommands), 'commands.replyToUnknownCommands must be true or false.');
	check(
		Number.isFinite(commands?.defaultCooldownSeconds) && commands.defaultCooldownSeconds >= 0,
		'commands.defaultCooldownSeconds must be a number, 0 or more.',
	);

	const channelId = logging?.commandLogChannelId;
	check(
		channelId === '' || SNOWFLAKE_PATTERN.test(channelId ?? ''),
		'logging.commandLogChannelId must be empty or a channel ID (17-20 digits).',
	);

	check(isBoolean(updateCheck?.enabled), 'updateCheck.enabled must be true or false.');
	check(
		!updateCheck?.enabled || /^[\w.-]+\/[\w.-]+$/.test(updateCheck.repository ?? ''),
		'updateCheck.repository must look like "owner/name".',
	);

	for (const key of MESSAGE_KEYS) {
		check(isNonEmptyString(messages?.[key]), `messages.${key} must not be empty.`);
	}

	return issues;
}

module.exports = { validateConfig };
