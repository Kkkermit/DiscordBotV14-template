# Events

Events let your bot react to anything that happens on Discord: messages, members joining, reactions, voice changes
and much more. Every `.js` file in `src/events/<category>/` is registered automatically on startup.

## Writing an event

```js
// src/events/guilds/channelCreate.js
const { Events } = require('discord.js');
const { logger } = require('../../lib/logger');

const log = logger.child('Channels');

module.exports = {
  name: Events.ChannelCreate,

  async execute(channel) {
    log.info(`#${channel.name} was created in ${channel.guild.name}.`);
  },
};
```

| Property  | Required | Description                                                                          |
| --------- | -------- | ------------------------------------------------------------------------------------ |
| `name`    | Yes      | The event to listen to. Use the `Events` enum from discord.js to avoid typos.        |
| `execute` | Yes      | Receives the event's arguments, **followed by the client** as the last argument.     |
| `once`    | No       | `true` to run only the first time the event fires (used by the `ClientReady` event). |

Errors thrown inside `execute` are caught and logged with the file name, so one broken event can't crash the bot. The
template warns you on startup if `name` isn't a known discord.js event, which catches typos such as `'messagecreate'`.

Several files can listen to the same event. The template does this with `messageCreate`: one file handles prefix
commands and another replies when the bot is mentioned.

> [!NOTE]
> The arguments depend on the event. For example `Events.MessageCreate` gives `(message, client)`,
> `Events.GuildMemberUpdate` gives `(oldMember, newMember, client)`. The
> [discord.js documentation](https://discord.js.org/docs/packages/discord.js/14.28.1/Client:Class) lists each event's
> arguments.

## Gateway intents

Discord only sends the events your bot asks for with **intents**. The template asks for `Guilds`, `GuildMessages`
and `MessageContent`. If your event never fires, it most likely needs another intent.

| To receive...                        | Add the intent          | Also turn on in the Developer Portal (Bot page) |
| ------------------------------------ | ----------------------- | ----------------------------------------------- |
| Members joining, leaving or updating | `GuildMembers`          | **Server Members Intent**                       |
| Online status and activities         | `GuildPresences`        | **Presence Intent**                             |
| Reactions on messages                | `GuildMessageReactions` |                                                 |
| Voice channel joins and leaves       | `GuildVoiceStates`      |                                                 |
| Bans and audit log entries           | `GuildModeration`       |                                                 |
| Direct messages                      | `DirectMessages`        |                                                 |

Add the intent to the list in [`src/client.js`](../src/client.js):

```js
intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers, // Added for member join events.
],
```

If the last column says so, also turn the switch on in the Developer Portal. Otherwise the bot can't log in and shows
"Used disallowed intents". Only add what you need: every intent means more events to process, and bots in 100 or more
servers need Discord's approval for these.

For direct messages, also add `partials: [Partials.Channel]` next to `intents` in `src/client.js` (DM channels aren't
cached until a message arrives). The bundled prefix commands and mention reply only answer in servers.

## Example: welcome messages

```js
// src/events/guilds/guildMemberAdd.js
const { Events } = require('discord.js');

const WELCOME_CHANNEL_ID = '123456789012345678';

module.exports = {
  name: Events.GuildMemberAdd,

  async execute(member) {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel?.isSendable()) return;
    await channel.send(`Welcome to **${member.guild.name}**, ${member}!`);
  },
};
```

This needs the `GuildMembers` intent. To store the channel per server instead of hard-coding it, see the
[database guide](database.md).
