'use strict';

const { Schema, model } = require('mongoose');

/**
 * Example model: per-server settings.
 *
 * It isn't used by the template out of the box. It's here to show where models live and how
 * to define one. Delete it, or build on it, e.g. to store a welcome channel per server:
 *
 * @example
 * const GuildSettings = require('../../../database/models/GuildSettings');
 * const { isDatabaseConnected } = require('../../../database/connection');
 *
 * if (!isDatabaseConnected()) return interaction.reply('The database is not configured.');
 * const settings = await GuildSettings.findOneAndUpdate(
 * 	{ guildId: interaction.guildId },
 * 	{ $set: { welcomeChannelId: channel.id } },
 * 	{ upsert: true, returnDocument: 'after' },
 * );
 */
const guildSettingsSchema = new Schema(
	{
		guildId: { type: String, required: true, unique: true },
		welcomeChannelId: { type: String, default: null },
	},
	{ timestamps: true },
);

module.exports = model('GuildSettings', guildSettingsSchema);
