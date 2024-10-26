const { Events } = require('discord.js');
const { color, getTimestamp } = require('../../utils/logEffects.js');

module.exports = {
    name: Events.GuildDelete,
    async execute(client, guild) {
        try {
            let theowner = process.env.devid;
    
            await guild.fetchOwner().then(({ user }) => { theowner = user; }).catch(() => {});
    
            console.log(`${color.blue}[${getTimestamp()}]${color.reset} [GUILD_DELETE] ${client.user.username} has left a guild. \n${color.blue}> GuildName: ${guild.name} \n> GuildID: ${guild.id} \n> Owner: ${theowner ? `${theowner.tag} (${theowner.id})` : `${theowner} (${guild.ownerId})`} \n> MemberCount: ${guild.memberCount}`)
        } catch (error) {
            client.logs.error(`[GUILD_DELETE] Error while logging guild deletion.`);
        }
    }
}