const { Events } = require('discord.js');
const { printBanner } = require('../../lib/banner');
const { logger } = require('../../lib/logger');
const { checkForUpdates } = require('../../lib/updateChecker');

const log = logger.child('Ready');

async function registerSlashCommands(client) {
	// Registering replaces the whole list, so it would delete a command whose file failed to load.
	if (client.failedSlashCommandFiles.length > 0) {
		log.warn('Slash commands were not registered because a command file failed to load. Fix it and restart.');
		return;
	}

	const registered = await client.application.commands.set(client.slashCommands.map((command) => command.data));
	log.success(`Registered ${registered.size} slash command(s).`);
}

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		log.success(`Logged in as ${client.user.tag} (${client.user.id}).`);

		try {
			await registerSlashCommands(client);
		} catch (error) {
			log.error('Could not register the slash commands with Discord:', error);
		}

		if (client.config.banner.enabled) printBanner(client);

		if (client.config.updateCheck.enabled) {
			await checkForUpdates({ repository: client.config.updateCheck.repository });
		}
	},
};
