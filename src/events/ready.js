module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {

        client.logs = require('../utils/logs');

        client.logs.success(`[BOT] ${client.user.username} has been launched!`);
        client.logs.success(`[Events] Loaded ${client.eventNames().length} events.`);
    },
};