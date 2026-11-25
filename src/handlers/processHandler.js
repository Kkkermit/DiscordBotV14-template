'use strict';

const { disconnectDatabase, isDatabaseConnected } = require('../database/connection');
const { logger } = require('../lib/logger');

const log = logger.child('Process');

/** Exit anyway if a graceful shutdown hangs. Kept below Docker's default 10 second stop timeout. */
const SHUTDOWN_TIMEOUT_MS = 8_000;

/**
 * Handles process signals and otherwise-uncaught errors.
 *
 * - `SIGINT` (Ctrl+C) and `SIGTERM` (Docker, PM2, hosting panels) close Discord and the database cleanly.
 *   Pressing Ctrl+C a second time forces the process to quit.
 * - Unhandled promise rejections are logged; the bot keeps running.
 * - Uncaught exceptions are logged and the bot shuts down, because Node.js can be left in a broken
 *   state after one. Use a process manager (Docker, PM2, systemd) to restart it automatically.
 *
 * @param {import('../client').BotClient} client
 * @returns {{ shutdown: (reason: string, exitCode?: number) => Promise<void> }}
 */
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

	process.on('uncaughtException', (error) => {
		log.error('Uncaught exception:', error);
		shutdown('Uncaught exception', 1);
	});

	return { shutdown };
}

module.exports = { registerProcessHandlers };
