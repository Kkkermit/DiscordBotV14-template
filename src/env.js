const path = require('node:path');
const { LEVEL_NAMES } = require('./lib/logger');
const { SNOWFLAKE_PATTERN } = require('./lib/constants');

const ENV_FILE_PATH = path.resolve(__dirname, '..', '.env');

class EnvValidationError extends Error {
	constructor(issues) {
		super(`Invalid environment configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
		this.name = 'EnvValidationError';
		this.issues = issues;
	}
}

// Variables that are already set (by Docker or a hosting panel, for example) are not overwritten.
function loadEnvFile(filePath = ENV_FILE_PATH) {
	try {
		process.loadEnvFile(filePath);
		return true;
	} catch (error) {
		if (error?.code === 'ENOENT') return false;
		throw error;
	}
}

function parseEnv(source = process.env) {
	const issues = [];
	const read = (name) => source[name]?.trim() || null;

	const token = read('DISCORD_TOKEN');
	if (!token) {
		issues.push('DISCORD_TOKEN is required. Copy it from the "Bot" page of the Discord Developer Portal.');
	}

	const developerIds = (read('DEVELOPER_IDS') ?? '')
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);
	const invalidIds = developerIds.filter((id) => !SNOWFLAKE_PATTERN.test(id));
	if (invalidIds.length > 0) {
		issues.push(`DEVELOPER_IDS must be a comma-separated list of user IDs. Invalid: ${invalidIds.join(', ')}.`);
	}

	const mongoUri = read('MONGODB_URI');
	if (mongoUri && !/^mongodb(\+srv)?:\/\//.test(mongoUri)) {
		issues.push('MONGODB_URI must start with "mongodb://" or "mongodb+srv://".');
	}

	const logLevel = (read('LOG_LEVEL') ?? 'info').toLowerCase();
	if (!LEVEL_NAMES.includes(logLevel)) {
		issues.push(`LOG_LEVEL must be one of: ${LEVEL_NAMES.join(', ')}. Received "${logLevel}".`);
	}

	if (issues.length > 0) throw new EnvValidationError(issues);

	return Object.freeze({
		token,
		developerIds: Object.freeze([...new Set(developerIds)]),
		mongoUri,
		logLevel,
	});
}

function loadEnv() {
	loadEnvFile();
	return parseEnv(process.env);
}

module.exports = { ENV_FILE_PATH, EnvValidationError, loadEnvFile, parseEnv, loadEnv };
