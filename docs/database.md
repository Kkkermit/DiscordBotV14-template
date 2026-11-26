# Database

The template supports [MongoDB](https://www.mongodb.com/) through [Mongoose](https://mongoosejs.com/). It's optional:
when `MONGODB_URI` is empty the bot runs without a database.

## Getting a connection string

**MongoDB Atlas (free, hosted):**

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free cluster.
2. Under **Database Access**, create a database user with a strong password.
3. Under **Network Access**, add the IP address of the machine running your bot. (`0.0.0.0/0` allows any IP. It's
   convenient while testing but less secure, so use your server's IP in production.)
4. Click **Connect → Drivers** and copy the connection string. Replace `<password>` with your user's password and add
   a database name after the host, e.g. `...mongodb.net/discord-bot?retryWrites=true&w=majority`.

**Locally with Docker:** `docker compose --profile database up -d` starts MongoDB next to the bot. Use
`MONGODB_URI=mongodb://mongo:27017/discord-bot`. See [Deployment](deployment.md#docker).

Put the string in your `.env` file as `MONGODB_URI`. On startup the bot connects before logging in to Discord. If it
can't connect, it explains why and stops, so you never end up with a bot that silently has no database.

## Models

Models live in `src/database/models/`. The template includes an example,
[`GuildSettings.js`](../src/database/models/GuildSettings.js), that stores settings per server:

```js
const { Schema, model } = require('mongoose');

const guildSettingsSchema = new Schema(
  {
    guildId: { type: String, required: true, unique: true },
    welcomeChannelId: { type: String, default: null },
  },
  { timestamps: true },
);

module.exports = model('GuildSettings', guildSettingsSchema);
```

Store Discord IDs as strings: they are too large for JavaScript numbers.

## Using a model in a command

```js
// src/commands/slash/admin/set-welcome.js
const {
  ChannelType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} = require('discord.js');
const { isDatabaseConnected } = require('../../../database/connection');
const GuildSettings = require('../../../database/models/GuildSettings');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('set-welcome')
    .setDescription('Choose the channel for welcome messages.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .addChannelOption((option) =>
      option.setName('channel').setDescription('The channel.').addChannelTypes(ChannelType.GuildText).setRequired(true),
    ),

  async execute(interaction) {
    if (!isDatabaseConnected()) {
      await interaction.reply({ content: 'The database is not configured.', flags: MessageFlags.Ephemeral });
      return;
    }

    const channel = interaction.options.getChannel('channel', true);
    await GuildSettings.findOneAndUpdate(
      { guildId: interaction.guildId },
      { $set: { welcomeChannelId: channel.id } },
      { upsert: true, returnDocument: 'after' },
    );

    await interaction.reply(`Welcome messages will be sent in ${channel}.`);
  },
};
```

Reading it back in an event:

```js
const settings = await GuildSettings.findOne({ guildId: member.guild.id }).lean();
if (!settings?.welcomeChannelId) return;
```

`.lean()` returns a plain object, which is faster when you only need to read the data.

## Tips

- Check `isDatabaseConnected()` in commands that need the database if your bot can also run without one.
- Errors thrown by database calls inside a command are caught and logged like any other command error.
- The connection is closed cleanly when the bot shuts down.
- Using another database (PostgreSQL, SQLite...)? Replace `src/database/connection.js` and the `connectDatabase` call
  in `src/index.js`, and remove the `mongoose` dependency.
