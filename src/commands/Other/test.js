const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Test command'),
    async execute(interaction) {

        const embed = new EmbedBuilder()
        .setColor("Random")
        .setDescription(`Test command successful | ${client.user.username} is online!`)

        await interaction.reply({ content: `<@${interaction.user.username}>` , embeds: [embed]})
    }
}