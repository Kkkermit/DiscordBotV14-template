const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	MessageFlags,
	time,
	TimestampStyles,
	version: discordJsVersion,
} = require('discord.js');
const { createEmbed } = require('./embeds');
const { formatDuration } = require('./format');
const { logger } = require('./logger');

const log = logger.child('BotInfo');

const REFRESH_BUTTON_ID = 'bot-info:refresh';
const REFRESH_TIMEOUT_MS = 60_000;

function createBotInfoEmbed(client) {
	const ping = client.ws.ping >= 0 ? `${Math.round(client.ws.ping)}ms` : 'measuring...';

	return createEmbed(client)
		.setAuthor({ name: `${client.user.username} information`, iconURL: client.user.displayAvatarURL() })
		.setThumbnail(client.user.displayAvatarURL({ size: 256 }))
		.addFields(
			{ name: 'Developer', value: `\`${client.config.developerName}\``, inline: true },
			{ name: 'Servers', value: `\`${client.guilds.cache.size}\``, inline: true },
			{ name: 'Members', value: `\`${client.countMembers()}\``, inline: true },
			{ name: 'Slash commands', value: `\`${client.slashCommands.size}\``, inline: true },
			{ name: 'Prefix commands', value: `\`${client.prefixCommands.size}\``, inline: true },
			{ name: 'Prefix', value: `\`${client.config.prefix}\``, inline: true },
			{ name: 'Latency', value: `\`${ping}\``, inline: true },
			{ name: 'Uptime', value: `\`${formatDuration(client.uptime)}\``, inline: true },
			{ name: 'Online since', value: time(client.readyAt, TimestampStyles.RelativeTime), inline: true },
			{ name: 'Versions', value: `Node.js \`${process.version}\` • discord.js \`v${discordJsVersion}\`` },
		)
		.setTimestamp();
}

function createRefreshRow(disabled) {
	const refreshButton = new ButtonBuilder()
		.setCustomId(REFRESH_BUTTON_ID)
		.setLabel('Refresh')
		.setEmoji('🔄')
		.setStyle(ButtonStyle.Primary)
		.setDisabled(disabled);
	return new ActionRowBuilder().addComponents(refreshButton);
}

function createBotInfoPayload(client) {
	return { embeds: [createBotInfoEmbed(client)], components: [createRefreshRow(false)] };
}

// Only the person who ran the command can press Refresh, and only for a minute.
function collectRefreshClicks({ message, userId, client, edit }) {
	const collector = message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (interaction) => interaction.customId === REFRESH_BUTTON_ID,
		time: REFRESH_TIMEOUT_MS,
	});

	collector.on('collect', async (interaction) => {
		try {
			if (interaction.user.id !== userId) {
				await interaction.reply({
					content: 'Only the person who used this command can refresh it.',
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			await interaction.update(createBotInfoPayload(client));
		} catch (error) {
			log.error('Could not refresh the bot information:', error);
		}
	});

	collector.on('end', async () => {
		try {
			await edit({ components: [createRefreshRow(true)] });
		} catch (error) {
			// The message may have been deleted in the meantime, which is fine.
			log.debug('Could not disable the refresh button:', error);
		}
	});
}

module.exports = { createBotInfoEmbed, createBotInfoPayload, collectRefreshClicks };
