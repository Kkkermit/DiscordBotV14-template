const { disconnectDatabase, isDatabaseConnected } = require('../database/connection');
const { logger } = require('../lib/logger');

const log = logger.child('Process');

// Exit anyway if shutting down hangs. Docker stops waiting after 10 seconds.
const SHUTDOWN_TIMEOUT_MS = 8_000;

function registerProcessHandlers(client) {
	let shuttingDown = false;

	async function shutdown(reason, exitCode = 0) {
		if (shuttingDown) return;
		shuttingDown = true;

		log.warn(`${reason}: shutting down...`);
		const forceExit = setTimeout(() => {
			log.error(`Shutdown took longer than ${SHUTDOWN_TIMEOUT_MS / 1000}s, forcing exit.`);
			process.exit(exitCode || 1);
		}, SHUTDOWN_TIMEOUT_MS).unref();

		try {
			await client.destroy();
			// A connection attempt still in progress can't be cancelled; exiting drops it.
			if (isDatabaseConnected()) await disconnectDatabase();
			log.info('Goodbye!');
		} catch (error) {
			log.error('Error during shutdown:', error);
			exitCode ||= 1;
		} finally {
			clearTimeout(forceExit);
			process.exit(exitCode);
		}
	}

	process.once('SIGINT', () => shutdown('Received SIGINT'));
	process.once('SIGTERM', () => shutdown('Received SIGTERM'));

	process.on('unhandledRejection', (reason) => {
		log.error('Unhandled promise rejection:', reason);
	});

	// Node.js can be left in a broken state after an uncaught exception, so stop the bot.
	process.on('uncaughtException', (error) => {
		log.error('Uncaught exception:', error);
		shutdown('Uncaught exception', 1);
	});

	return { shutdown };
}

module.exports = { registerProcessHandlers };
