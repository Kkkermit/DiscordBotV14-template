const { Events } = require('discord.js');
const { startPresenceRotation } = require('../../lib/presence');

// Discord forgets the bot's status whenever it starts a new session (on startup and after some reconnects),
// so set it each time the connection is ready.
module.exports = {
	name: Events.ShardReady,
	execute(_shardId, _unavailableGuilds, client) {
		startPresenceRotation(client);
	},
};
