const mongoose = require('mongoose');
const { logger } = require('../lib/logger');

const log = logger.child('Database');

let listenersAttached = false;

async function connectDatabase(uri) {
	log.info('Connecting to MongoDB...');
	const connection = await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
	log.success(`Connected to MongoDB (database "${mongoose.connection.name}").`);

	// Added after connecting, so a failed first connection is only reported once.
	if (!listenersAttached) {
		mongoose.connection.on('disconnected', () => log.warn('Disconnected from MongoDB.'));
		mongoose.connection.on('reconnected', () => log.success('Reconnected to MongoDB.'));
		mongoose.connection.on('error', (error) => log.error('MongoDB connection error:', error));
		listenersAttached = true;
	}
	return connection;
}

async function disconnectDatabase() {
	if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) return;
	await mongoose.disconnect();
}

function isDatabaseConnected() {
	return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}

module.exports = { connectDatabase, disconnectDatabase, isDatabaseConnected };
