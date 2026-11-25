'use strict';

// ██████╗ ███████╗██╗   ██╗    ██████╗ ██╗   ██╗    ██╗  ██╗██╗  ██╗███████╗██████╗ ███╗   ███╗██╗████████╗
// ██╔══██╗██╔════╝██║   ██║    ██╔══██╗╚██╗ ██╔╝    ██║ ██╔╝██║ ██╔╝██╔════╝██╔══██╗████╗ ████║██║╚══██╔══╝
// ██║  ██║█████╗  ██║   ██║    ██████╔╝ ╚████╔╝     █████╔╝ █████╔╝ █████╗  ██████╔╝██╔████╔██║██║   ██║
// ██║  ██║██╔══╝  ╚██╗ ██╔╝    ██╔══██╗  ╚██╔╝      ██╔═██╗ ██╔═██╗ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║
// ██████╔╝███████╗ ╚████╔╝     ██████╔╝   ██║       ██║  ██╗██║  ██╗███████╗██║  ██║██║ ╚═╝ ██║██║   ██║
// ╚═════╝ ╚══════╝  ╚═══╝      ╚═════╝    ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝   ╚═╝
//
// Discord Bot V14 Template by Kkermit. Released under the MIT License.

const { BotClient } = require('./client');
const config = require('./config');
const { connectDatabase } = require('./database/connection');
const { EnvValidationError, loadEnv } = require('./env');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { registerProcessHandlers } = require('./handlers/processHandler');
const { logger } = require('./lib/logger');
const { validateConfig } = require('./lib/validateConfig');

const log = logger.child('Startup');

/**
 * Turns common login failures into actionable hints.
 *
 * @param {unknown} error
 * @returns {string}
 */
function describeLoginError(error) {
	const message = String(error?.message ?? error);
	if (error?.code === 'TokenInvalid' || /invalid token|authentication failed/i.test(message)) {
		return 'Discord rejected the token. Reset it on the "Bot" page of the Developer Portal and update DISCORD_TOKEN.';
	}
	if (/disallowed intents/i.test(message)) {
		return 'Enable "Message Content Intent" (and any other privileged intents you use) on the "Bot" page of the Developer Portal.';
	}
	return 'Check your internet connection and that DISCORD_TOKEN is correct.';
}

async function main() {
	let env;
	try {
		env = loadEnv();
	} catch (error) {
		if (!(error instanceof EnvValidationError)) throw error;
		for (const issue of error.issues) log.error(issue);
		log.error('Fix your .env file (run "npm run setup" to create one) and start the bot again.');
		process.exitCode = 1;
		return;
	}
	logger.setLevel(env.logLevel);

	const configIssues = validateConfig(config);
	if (configIssues.length > 0) {
		for (const issue of configIssues) log.error(`src/config.js: ${issue}`);
		process.exitCode = 1;
		return;
	}

	const client = new BotClient(env);
	const { shutdown } = registerProcessHandlers(client);

	loadCommands(client);
	loadEvents(client);

	if (env.mongoUri) {
		try {
			await connectDatabase(env.mongoUri);
		} catch (error) {
			log.error(`Could not connect to MongoDB: ${error?.message ?? error}`);
			log.error('Check MONGODB_URI (and your IP allow-list), or remove it to run without a database.');
			log.debug(error);
			await shutdown('Database connection failed', 1);
			return;
		}
	} else {
		log.info('MONGODB_URI is not set, running without a database.');
	}

	try {
		log.info('Logging in to Discord...');
		await client.login(env.token);
	} catch (error) {
		log.error(`Could not log in to Discord: ${error?.message ?? error}`);
		log.error(describeLoginError(error));
		log.debug(error);
		await shutdown('Login failed', 1);
	}
}

main().catch((error) => {
	log.error('Fatal error during startup:', error);
	process.exitCode = 1;
});
