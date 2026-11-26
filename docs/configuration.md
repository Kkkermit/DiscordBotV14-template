# Configuration

The bot is configured in two places:

- **`.env`** for secrets and settings that change between machines (your token, database URL...). Never commit it.
- **[`src/config.js`](../src/config.js)** for everything else. It is safe to commit.

Both are validated when the bot starts. If a value is wrong, the bot tells you which one and why, then stops.

## Environment variables

Create the `.env` file with `npm run setup`, or copy [`.env.example`](../.env.example). Variables that are already set
in your environment (for example by Docker or your hosting panel) take priority over the file.

| Variable        | Required | Default | Description                                                                                |
| --------------- | -------- | ------- | ------------------------------------------------------------------------------------------ |
| `DISCORD_TOKEN` | Yes      |         | The bot token from **Developer Portal → Bot → Reset Token**.                               |
| `DEVELOPER_IDS` | No       |         | Comma-separated user IDs, e.g. `123...,456...`. They can use `developerOnly` commands.     |
| `MONGODB_URI`   | No       |         | A `mongodb://` or `mongodb+srv://` connection string. The database is disabled when empty. |
| `LOG_LEVEL`     | No       | `info`  | `debug` shows everything, `warn` and `error` show only problems.                           |

> [!NOTE]
> Coming from v3? The old names (`token`, `clientid`, `guildid`, `devid`, `mongodb`) are no longer read.
> `clientid` and `guildid` aren't needed any more. See the [migration guide](../CHANGELOG.md#400).

## config.js

### General

| Setting          | Default         | Description                                                                                          |
| ---------------- | --------------- | ---------------------------------------------------------------------------------------------------- |
| `prefix`         | `'?'`           | Prefix for message commands. Must not contain spaces.                                                |
| `embedColor`     | `'Blurple'`     | Default embed colour: a discord.js colour name (`'Green'`, `'Red'`...) or a hex number (`0x5865f2`). |
| `developerName`  | `'Kkermit'`     | Shown in `bot-info` and in embed footers.                                                            |
| `banner.enabled` | `true`          | Print the bot's name as ASCII art, and a short summary, once it is online.                           |
| `banner.font`    | `'ANSI Shadow'` | The [figlet font](https://patorjk.com/software/taag) used for the name.                              |

### presence

| Setting                 | Default    | Description                                                                                                   |
| ----------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `status`                | `'online'` | `'online'`, `'idle'`, `'dnd'` or `'invisible'`.                                                               |
| `rotateIntervalSeconds` | `30`       | Seconds between activities. At least 15 (Discord rate limits), or `0` to not rotate.                          |
| `activities`            | 3 entries  | List of `{ type, name }`. `type` is an `ActivityType`; `name` is a string or a function receiving the client. |

```js
activities: [
	{ type: ActivityType.Watching, name: (client) => `${client.guilds.cache.size} servers` },
	{ type: ActivityType.Custom, name: 'Building something cool' },
],
```

### commands

| Setting                  | Default | Description                                                                       |
| ------------------------ | ------- | --------------------------------------------------------------------------------- |
| `defaultCooldownSeconds` | `3`     | Cooldown for commands that don't set `cooldown`. `0` disables it.                 |
| `mentionAsPrefix`        | `true`  | Allow `@YourBot ping` as well as `?ping`.                                         |
| `replyToUnknownCommands` | `true`  | Reply with a hint when someone types the prefix and a command that doesn't exist. |

### logging

| Setting               | Default | Description                                                                       |
| --------------------- | ------- | --------------------------------------------------------------------------------- |
| `commandLogChannelId` | `''`    | Channel ID where every command use is posted as an embed. Leave empty to disable. |

Every command use is always logged to the console. If the bot can't post in the log channel, it logs one warning and
stops trying until the next restart.

### updateCheck

| Setting      | Default                             | Description                                                  |
| ------------ | ----------------------------------- | ------------------------------------------------------------ |
| `enabled`    | `true`                              | Check GitHub on startup for a newer release of the template. |
| `repository` | `'Kkkermit/DiscordBotV14-template'` | The `owner/name` whose releases are checked.                 |

The check compares the `version` in `package.json` with the template's latest release. It makes one anonymous
request to the GitHub API, never blocks startup and fails silently. Once `version` is your own bot's version, turn
it off.

### messages

The replies users see. `{placeholders}` are filled in automatically.

| Setting          | Placeholders    | Shown when                                             |
| ---------------- | --------------- | ------------------------------------------------------ |
| `error`          |                 | A command throws an error.                             |
| `noPermission`   | `{permissions}` | A member lacks the permissions a prefix command needs. |
| `developerOnly`  |                 | Someone else uses a `developerOnly` command.           |
| `cooldown`       | `{time}`        | A command is used again before its cooldown ends.      |
| `missingArgs`    | `{usage}`       | A prefix command with `args: true` gets no arguments.  |
| `unknownCommand` | `{prefix}`      | A prefix command doesn't exist.                        |

## Gateway intents

Intents decide which events Discord sends to the bot. They are set in [`src/client.js`](../src/client.js), not in
`config.js`. See [Events → Gateway intents](events.md#gateway-intents) for which intent you need and how to add it.
