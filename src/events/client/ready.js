'use strict';

const { ApplicationCommandType, Collection, Events } = require('discord.js');
const { printBanner } = require('../../lib/banner');
const { deployCommands, fetchRegisteredCommands } = require('../../lib/deployCommands');
const { logger } = require('../../lib/logger');
const { startPresenceRotation } = require('../../lib/presence');
const { checkForUpdates } = require('../../lib/updateChecker');

const log = logger.child('Ready');

/**
 * Registers (or fetches) the slash commands and remembers their IDs so `/help` can show clickable mentions.
 *
 * @param {import('../../client').BotClient} client
 */
async function syncSlashCommands(client) {
	const { guildId } = client.env;
	const scope = guildId ? `server ${guildId}` : 'all servers (global)';
	const options = { rest: client.rest, applicationId: client.application.id, guildId };

	let registered;
	if (client.config.commands.registerOnStartup) {
		const body = client.slashCommands.map((command) => command.data.toJSON());
		registered = await deployCommands({ ...options, body });
		log.success(`Registered ${registered.length} slash command(s) in ${scope}.`);
		if (!guildId)
			log.info('Global commands can take up to an hour to appear. Set DISCORD_GUILD_ID while developing.');
	} else {
		registered = await fetchRegisteredCommands(options);
		log.info(
			`Found ${registered.length} registered slash command(s) in ${scope}. Run "npm run deploy" after changes.`,
		);
	}

	client.commandIds = new Collection(
		registered
			.filter(
				(command) => (command.type ?? ApplicationCommandType.ChatInput) === ApplicationCommandType.ChatInput,
			)
			.map((command) => [command.name, command.id]),
	);
}

/** @type {import('../../types').BotEvent} */
module.exports = {
	name: Events.ClientReady,
	once: true,
	/** @param {import('../../client').BotClient} client The ready client. */
	async execute(client) {
		log.success(`Logged in as ${client.user.tag} (${client.user.id}).`);

		startPresenceRotation(client);

		try {
			await syncSlashCommands(client);
		} catch (error) {
			log.error('Could not sync slash commands with Discord:', error);
			if (client.env.guildId) log.error('Make sure the bot is in the server set as DISCORD_GUILD_ID.');
		}

		if (client.config.showStartupBanner) printBanner(client);

		if (client.config.updateCheck.enabled) {
			await checkForUpdates({ repository: client.config.updateCheck.repository });
		}
	},
};
