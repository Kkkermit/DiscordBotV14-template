const { Interaction, EmbedBuilder } = require("discord.js");

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`There was an error while executing this command!\n\`\`\`Command not found\`\`\``)

        if (!command) return
        
        try{


            await command.execute(interaction, client);
        } catch (error) {
            console.log(error);
            await interaction.reply({
                content: [embed],
                ephemeral: true
            });
        } 

    },
    


};