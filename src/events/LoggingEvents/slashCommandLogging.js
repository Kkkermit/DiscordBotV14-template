const { Events, EmbedBuilder } = require('discord.js');
const { color, getTimestamp } = require('../../utils/logEffects.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (!interaction) return;
        if (!interaction.isChatInputCommand()) return;
        else {
            try {

            const channelId = client.config.slashCommandLoggingChannel;
            if (!channelId) return client.logs.error(`[SLASH_COMMAND_LOGGING_ERROR] No channel ID provided in the config. Please provide a valid channel ID.`);

            const channel = await client.channels.cache.get(channelId);
            const server = interaction.guild.name;
            const user = interaction.user.username;
            const userID = interaction.user.id;

            const embed = new EmbedBuilder()
            .setColor(client.config.embedColor)
            .setAuthor({ name: `${user} has used a command.`, iconURL: client.user.avatarURL({ dynamic: true })})
            .setTitle(`${client.user.username} Command Logger`)
            .addFields({ name: 'Server Name', value: `${server}`})
            .addFields({ name: 'Command', value: `\`\`\`${interaction}\`\`\``})
            .addFields({ name: 'User', value: `${user} | ${userID}`})
            .setTimestamp()
            .setFooter({ text: `Command Logger ${client.config.devBy}`, iconURL: interaction.user.avatarURL({ dynamic: true })})

            await channel.send({ embeds: [embed] });
            console.log(`${color.torquise}[${getTimestamp()}]${color.reset} [SLASH_COMMAND_USED] ${user} has used a command. \n${color.torquise}> Server: ${server} \n> Command: ${interaction} \n> User: ${user} \n> UserID: ${userID}`)
        } catch (error) {
            client.logs.error(`[SLASH_COMMAND_USED] Error while logging command usage. Check if you have the correct channel ID in your config.`);
        }};
    }
}