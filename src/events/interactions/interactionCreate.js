'use strict';

const { Events } = require('discord.js');
const { logCommandUsage } = require('../../lib/commandLogger');
const { checkCooldown } = require('../../lib/cooldowns');
const { createNoticeEmbed } = require('../../lib/embeds');
const { logger } = require('../../lib/logger');
const { replyEphemeral } = require('../../lib/replies');

const log = logger.child('Interactions');

/**
 * @typedef {import('discord.js').ChatInputCommandInteraction | import('discord.js').ContextMenuCommandInteraction} CommandInteraction
 */

/**
 * Replies with a notice, logging (instead of throwing) if the interaction can no longer be answered.
 *
 * @param {CommandInteraction} interaction
 * @param {string} message
 */
async function sendNotice(interaction, message) {
	try {
		await replyEphemeral(interaction, { embeds: [createNoticeEmbed(message)] });
	} catch (error) {
		log.error(`Could not reply to /${interaction.commandName}:`, error);
	}
}

/**
 * @param {import('discord.js').AutocompleteInteraction} interaction
 * @param {import('../../client').BotClient} client
 */
async function handleAutocomplete(interaction, client) {
	const command = client.slashCommands.get(interaction.commandName);
	if (!command?.autocomplete) return;
	// Suggestions can reveal data, so they follow the same rule as running the command.
	if (command.developerOnly && !client.isDeveloper(interaction.user.id)) {
		await interaction.respond([]);
		return;
	}

	try {
		await command.autocomplete(interaction, client);
	} catch (error) {
		log.error(`Autocomplete for /${interaction.commandName} failed:`, error);
		// Answer with no suggestions so the user isn't left with "Loading options failed".
		if (!interaction.responded) await interaction.respond([]).catch(() => {});
	}
}

/**
 * Runs slash and context menu commands, applying the developer-only and cooldown checks.
 *
 * @param {CommandInteraction} interaction
 * @param {import('../../client').BotClient} client
 */
async function handleCommand(interaction, client) {
	const { messages } = client.config;
	const command = client.slashCommands.get(interaction.commandName);

	if (!command) {
		log.warn(`Received unknown command "/${interaction.commandName}". Run "npm run deploy" to refresh commands.`);
		await sendNotice(interaction, 'This command is no longer available.');
		return;
	}

	if (command.developerOnly && !client.isDeveloper(interaction.user.id)) {
		await sendNotice(interaction, messages.developerOnly);
		return;
	}

	const cooldownMessage = checkCooldown(client, `slash:${command.data.name}`, interaction.user.id, command.cooldown);
	if (cooldownMessage) {
		await sendNotice(interaction, cooldownMessage);
		return;
	}

	// Not awaited, so logging never slows the command down.
	logCommandUsage(client, {
		type: 'slash',
		command: interaction.isChatInputCommand() ? interaction.toString() : interaction.commandName,
		user: interaction.user,
		guild: interaction.guild,
	});

	try {
		await command.execute(interaction, client);
	} catch (error) {
		log.error(`Error while running /${interaction.commandName} (${command.filePath}):`, error);
		await sendNotice(interaction, messages.error);
	}
}

/** @type {import('../../types').BotEvent} */
module.exports = {
	name: Events.InteractionCreate,
	/**
	 * @param {import('discord.js').Interaction} interaction
	 * @param {import('../../client').BotClient} client
	 */
	async execute(interaction, client) {
		if (interaction.isAutocomplete()) return handleAutocomplete(interaction, client);
		if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
			return handleCommand(interaction, client);
		}
		// Buttons, select menus and modals are handled by collectors inside the commands that create them.
	},
};
