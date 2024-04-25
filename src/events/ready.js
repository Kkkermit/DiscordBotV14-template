module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {

        const color = {
            red: '\x1b[31m',
            orange: '\x1b[38;5;202m',
            yellow: '\x1b[33m',
            green: '\x1b[32m',
            blue: '\x1b[36m',
            reset: '\x1b[0m',
        }

        console.log(`${color.blue}[ BOT ] ${client.user.username} is online!`);
    },
};