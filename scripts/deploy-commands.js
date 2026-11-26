'use strict';

/**
 * Registers the slash commands with Discord without starting the bot.
 *
 *   npm run deploy               Register in DISCORD_GUILD_ID if set, otherwise globally.
 *   npm run deploy -- --global   Register globally even if DISCORD_GUILD_ID is set.
 *   npm run deploy -- --clear    Remove every command from the chosen scope (e.g. to fix duplicates).
 */

const { parseArgs } = require('node:util');
const { REST, Routes } = require('discord.js');
const { EnvValidationError, loadEnv } = require('../src/env');
const { loadSlashCommands } = require('../src/handlers/commandHandler');
const { deployCommands } = require('../src/lib/deployCommands');
const { logger } = require('../src/lib/logger');

const log = logger.child('Deploy');

async function main() {
	const { values: flags } = parseArgs({
		options: {
			global: { type: 'boolean', default: false },
			clear: { type: 'boolean', default: false },
		},
	});

	let env;
	try {
		env = loadEnv();
	} catch (error) {
		if (!(error instanceof EnvValidationError)) throw error;
		for (const issue of error.issues) log.error(issue);
		process.exitCode = 1;
		return;
	}
	logger.setLevel(env.logLevel);

	const guildId = flags.global ? null : env.guildId;
	const scope = guildId ? `server ${guildId}` : 'all servers (global)';

	let body = [];
	if (!flags.clear) {
		const { commands, failures } = loadSlashCommands();
		for (const { file, reason, error } of failures) {
			if (error) log.error(`Invalid command ${file}:`, error);
			else log.error(`Invalid command ${file}: ${reason}`);
		}
		if (failures.length > 0) {
			log.error('Fix the commands above before deploying, otherwise they would be removed from Discord.');
			process.exitCode = 1;
			return;
		}
		body = commands.map((command) => command.data.toJSON());
	}

	const rest = new REST().setToken(env.token);
	// The token belongs to one application, so its ID doesn't need to be configured separately.
	const application = await rest.get(Routes.currentApplication());
	const registered = await deployCommands({ rest, applicationId: application.id, guildId, body });

	if (flags.clear) {
		log.success(`Removed all slash commands from ${scope}.`);
	} else {
		log.success(`Registered ${registered.length} command(s) in ${scope}.`);
		if (!guildId) log.info('Global commands can take up to an hour to show up in every server.');
	}
}

main().catch((error) => {
	log.error('Deploying commands failed:', error);
	if (error?.status === 401) log.error('Discord rejected the token. Check DISCORD_TOKEN in your .env file.');
	if (error?.code === 50001) log.error('Missing access: make sure the bot has been invited to DISCORD_GUILD_ID.');
	process.exitCode = 1;
});
