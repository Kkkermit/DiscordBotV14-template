const { Schema, model } = require('mongoose');

const guildSettingsSchema = new Schema(
	{
		guildId: { type: String, required: true, unique: true },
		welcomeChannelId: { type: String, default: null },
	},
	{ timestamps: true },
);

module.exports = model('GuildSettings', guildSettingsSchema);
