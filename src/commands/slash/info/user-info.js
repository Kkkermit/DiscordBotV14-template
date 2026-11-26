'use strict';

const { SlashCommandBuilder, time, TimestampStyles } = require('discord.js');
const { createEmbed } = require('../../../lib/embeds');

/** Roles shown before the list is cut off, to stay within Discord's embed limits. */
const MAX_ROLES_SHOWN = 15;

/** @param {string[]} roles Role mentions, highest first. */
function formatRoles(roles) {
	if (roles.length === 0) return 'None';
	const shown = roles.slice(0, MAX_ROLES_SHOWN).join(' ');
	const hiddenCount = roles.length - MAX_ROLES_SHOWN;
	return hiddenCount > 0 ? `${shown} and ${hiddenCount} more` : shown;
}

/** @type {import('../../../types').SlashCommand} */
module.exports = {
	data: new SlashCommandBuilder()
		.setName('user-info')
		.setDescription('Show information about a user.')
		.addUserOption((option) =>
			option.setName('user').setDescription('The user to look up. Defaults to you.').setRequired(false),
		),

	async execute(interaction, client) {
		const user = interaction.options.getUser('user') ?? interaction.user;
		// `getMember` returns null outside servers or when the user isn't a member of this one.
		const member = interaction.inCachedGuild()
			? (interaction.options.getMember('user') ?? interaction.member)
			: null;

		const embed = createEmbed(client)
			.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
			.setThumbnail(user.displayAvatarURL({ size: 256 }))
			.addFields(
				{ name: 'User', value: `${user} (\`${user.id}\`)` },
				{ name: 'Account created', value: time(user.createdAt, TimestampStyles.RelativeTime), inline: true },
				{ name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
			);

		if (member && member.id === user.id) {
			// Every member has the @everyone role, whose ID is the server's ID, so leave it out.
			const roles = member.roles.cache
				.filter((role) => role.id !== interaction.guildId)
				.sort((a, b) => b.position - a.position)
				.map((role) => role.toString());

			embed.setColor(member.displayColor || client.config.embedColor).addFields(
				{
					name: 'Joined server',
					value: member.joinedAt ? time(member.joinedAt, TimestampStyles.RelativeTime) : 'Unknown',
					inline: true,
				},
				{ name: 'Nickname', value: member.nickname ?? 'None', inline: true },
				{ name: `Roles (${roles.length})`, value: formatRoles(roles) },
			);
		}

		await interaction.reply({ embeds: [embed], allowedMentions: { parse: [] } });
	},
};
