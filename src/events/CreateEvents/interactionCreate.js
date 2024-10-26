const { EmbedBuilder } = require("discord.js");
const { color, getTimestamp } = require('../../utils/logEffects.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return
        
        try{
            await command.execute(interaction, client);
        } catch (error) {

            console.error(`${color.red}[${getTimestamp()}] [INTERACTION_CREATE] Error while executing command. \n${color.red}[${getTimestamp()}] [INTERACTION_CREATE] Please check you are using the correct execute method: "async execute(interaction, client)": \n${color.red}[${getTimestamp()}] [INTERACTION_CREATE]`, error);

            const embed = new EmbedBuilder()
            .setColor("Red")
            .setDescription(`There was an error while executing this command!\n\`\`\`${error}\`\`\``);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } 
    },
};