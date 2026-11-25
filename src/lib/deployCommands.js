'use strict';

const { Routes } = require('discord.js');

/**
 * @typedef {object} DeployOptions
 * @property {import('discord.js').REST} rest REST client authenticated with the bot token.
 * @property {string} applicationId The bot's application (client) ID.
 * @property {string | null} [guildId] Register in this server only (updates instantly). Global when omitted.
 */

/**
 * @param {Pick<DeployOptions, 'applicationId' | 'guildId'>} options
 * @returns {`/${string}`} The API route for the requested scope.
 */
function commandsRoute({ applicationId, guildId }) {
	return guildId
		? Routes.applicationGuildCommands(applicationId, guildId)
		: Routes.applicationCommands(applicationId);
}

/**
 * Replaces the registered slash commands with `body` in a single request.
 * Commands missing from `body` are removed from Discord, so pass `[]` to clear them all.
 *
 * Global commands can take up to an hour to appear in every server; guild commands update instantly.
 *
 * @param {DeployOptions & { body: import('discord.js').RESTPostAPIApplicationCommandsJSONBody[] }} options
 * @returns {Promise<import('discord.js').APIApplicationCommand[]>} The commands as registered by Discord.
 */
async function deployCommands({ rest, applicationId, guildId = null, body }) {
	return /** @type {Promise<import('discord.js').APIApplicationCommand[]>} */ (
		rest.put(commandsRoute({ applicationId, guildId }), { body })
	);
}

/**
 * Fetches the slash commands currently registered with Discord.
 *
 * @param {DeployOptions} options
 * @returns {Promise<import('discord.js').APIApplicationCommand[]>}
 */
async function fetchRegisteredCommands({ rest, applicationId, guildId = null }) {
	return /** @type {Promise<import('discord.js').APIApplicationCommand[]>} */ (
		rest.get(commandsRoute({ applicationId, guildId }))
	);
}

module.exports = { deployCommands, fetchRegisteredCommands };
