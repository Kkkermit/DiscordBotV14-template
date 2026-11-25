'use strict';

const { Routes } = require('discord.js');

/**
 * @typedef {object} DeployOptions
 * @property {import('discord.js').REST} rest REST client authenticated with the bot token.
 * @property {string} applicationId The bot's application (client) ID.
 * @property {string | null} [guildId] Register in this server only (updates instantly). Global when omitted.
 */

/**
 * The API route for the commands of a server, or of every server when `guildId` is empty.
 *
 * @param {string} applicationId
 * @param {string | null} guildId
 */
function commandsRoute(applicationId, guildId) {
	return guildId
		? Routes.applicationGuildCommands(applicationId, guildId)
		: Routes.applicationCommands(applicationId);
}

/**
 * Replaces the registered slash commands with `body` in a single request.
 * Commands missing from `body` are removed from Discord, so pass `[]` to clear them all.
 *
 * Global commands can take up to an hour to appear in every server; server commands update instantly.
 *
 * @param {DeployOptions & { body: import('discord.js').RESTPostAPIApplicationCommandsJSONBody[] }} options
 * @returns {Promise<any[]>} The commands as registered by Discord, including their IDs.
 */
function deployCommands({ rest, applicationId, guildId = null, body }) {
	return rest.put(commandsRoute(applicationId, guildId), { body });
}

/**
 * Fetches the slash commands currently registered with Discord.
 *
 * @param {DeployOptions} options
 * @returns {Promise<any[]>}
 */
function fetchRegisteredCommands({ rest, applicationId, guildId = null }) {
	return rest.get(commandsRoute(applicationId, guildId));
}

module.exports = { deployCommands, fetchRegisteredCommands };
