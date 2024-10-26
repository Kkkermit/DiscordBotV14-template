const { Events } = require("discord.js");
const { color, getTimestamp } = require("../../utils/logEffects.js");

module.exports = {
    name: Events.GuildCreate,
    async execute(client, guild) {
        try{ 
            let theowner = process.env.devid; 
            const channel2 = await guild.channels.cache.random()
            const channelId = channel2.id;
            const invite = await guild.invites.create(channelId)

            await guild.fetchOwner().then(({ user }) => { theowner = user; }).catch(() => {});

            console.log(`${color.orange}[${getTimestamp()}]${color.reset} [GUILD_CREATE] ${client.user.username} has been added to a new guild. \n${color.orange}> GuildName: ${guild.name} \n> GuildID: ${guild.id} \n> Owner: ${theowner ? `${theowner.tag} (${theowner.id})` : `${theowner} (${guild.ownerId})`} \n> MemberCount: ${guild.memberCount} \n> ServerNumber: ${client.guilds.cache.size} \n> ServerInvite: ${invite}`)
        } catch (error) {
            client.logs.error(`[GUILD_CREATE] Error while logging guild creation.`);
        }
    }
}