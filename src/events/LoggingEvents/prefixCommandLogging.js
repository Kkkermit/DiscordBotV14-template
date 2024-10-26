const { Events, EmbedBuilder } = require('discord.js');
const { color, getTimestamp } = require('../../utils/logEffects.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {

        const prefix = client.config.prefix
        if (!message.author.bot && message.content.startsWith(prefix)) {
            try {

            const channelId = client.config.prefixCommandLoggingChannel
            if (!channelId) return client.logs.error(`[PREFIX_COMMAND_LOGGING_ERROR] No channel ID provided in the config. Please provide a valid channel ID.`);

            const channel = await client.channels.cache.get(channelId);
            const server = message.guild.name;
            const user = message.author.username;
            const userID = message.author.id;

            const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setAuthor({ name: `${user} has used a command.`, iconURL: client.user.avatarURL({ dynamic: true }) })
            .setTitle(`${client.user.username} Command Logger`)
            .addFields({ name: 'Server Name', value: `${server}` })
            .addFields({ name: 'Command', value: `\`\`\`${message.content}\`\`\`` })
            .addFields({ name: 'User', value: `${user} | ${userID}` })
            .setTimestamp()
            .setFooter({ text: `Command Logger ${client.config.devBy}`, iconURL: message.author.avatarURL({ dynamic: true }) })

            await channel.send({ embeds: [embed] });
            console.log(`${color.purple}[${getTimestamp()}]${color.reset} [PREFIX_COMMAND_USED] ${user} has used a command. \n${color.purple}> Server: ${server} \n> Command: ${message.content} \n> User: ${user} \n> UserID: ${userID}`)
        } catch (error) {
            client.logs.error(`[PREFIX_COMMAND_USED] Error while logging command usage. Check if you have the correct channel ID in your config.`);
        }};
    }
}