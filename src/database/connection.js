'use strict';

const mongoose = require('mongoose');
const { logger } = require('../lib/logger');

const log = logger.child('Database');

let listenersAttached = false;

/**
 * Connects to MongoDB with Mongoose. Resolves once the connection is open.
 *
 * @param {string} uri MongoDB connection string (`mongodb://` or `mongodb+srv://`).
 * @returns {Promise<typeof mongoose>}
 */
async function connectDatabase(uri) {
	log.info('Connecting to MongoDB...');
	const connection = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
	log.success(`Connected to MongoDB (database "${mongoose.connection.name}").`);

	// Attached after the first connection so a failed initial connect is only reported once, by the caller.
	if (!listenersAttached) {
		mongoose.connection.on('disconnected', () => log.warn('Disconnected from MongoDB.'));
		mongoose.connection.on('reconnected', () => log.success('Reconnected to MongoDB.'));
		mongoose.connection.on('error', (error) => log.error('MongoDB connection error:', error));
		listenersAttached = true;
	}
	return connection;
}

/** Closes the MongoDB connection if one is open. Safe to call when the database is disabled. */
async function disconnectDatabase() {
	if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) return;
	await mongoose.disconnect();
}

/** @returns {boolean} Whether the bot currently has a working database connection. */
function isDatabaseConnected() {
	return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}

module.exports = { connectDatabase, disconnectDatabase, isDatabaseConnected };
