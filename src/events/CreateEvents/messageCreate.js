const { EmbedBuilder } = require('discord.js');
const { color, getTimestamp } = require('../../utils/logEffects.js');

module.exports = {
    name: "messageCreate",
    async execute(message, client) {

        if (message.author.bot || !message.guild || message.system || message.webhookId) return;

        if (!message.content.toLowerCase().startsWith(client.config.prefix)) {
            return;
        }
        const args = message.content.slice(client.config.prefix.length).trim().split(/ +/);

        let cmd = args.shift().toLowerCase();
            if (cmd.length === 0) return;

        let command = client.pcommands.get(cmd);
        if (!command) command = client.pcommands.get(client.aliases.get(cmd));

        if (!command) {
            try {

                const embed = new EmbedBuilder()
                .setColor("Red")
                .setTitle(`${client.user.username} prefix system ${client.config.arrowEmoji}`)
                .setDescription(`> The command you tried **does not exist**. \n> To see **all** commands, use \`\`${client.config.prefix}help\`\``);

                return message.reply({ embeds: [embed], ephemeral: true});
            } catch (error) {
                client.logs.error(`[PREFIX_ERROR] Error sending 'cannot find prefix' embed.`, error);
            };
        };

        if (!command) return;

        if (command.args && !args.length) {
            return message.reply(`You **didn't** provide any \`\`arguments\`\`.`);
        }

        try {
            command.execute(message, client, args);
        } catch (error) {
            console.error(`${color.red}[${getTimestamp()}] [MESSAGE_CREATE] Error while executing command. \n${color.red}[${getTimestamp()}] [MESSAGE_CREATE] Please check you are using the correct execute method: "async execute(message, client, args)": \n${color.red}[${getTimestamp()}] [MESSAGE_CREATE] `, error);

            const embed = new EmbedBuilder()
            .setColor("Red")
            .setDescription(`There was an error while executing this command!\n\`\`\`${error}\`\`\``)

            await message.reply({ embeds: [embed], ephemeral: true});
        }
    },
};
