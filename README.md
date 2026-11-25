<!--    ██████╗ ███████╗██╗   ██╗    ██████╗ ██╗   ██╗    ██╗  ██╗██╗  ██╗███████╗██████╗ ███╗   ███╗██╗████████╗
        ██╔══██╗██╔════╝██║   ██║    ██╔══██╗╚██╗ ██╔╝    ██║ ██╔╝██║ ██╔╝██╔════╝██╔══██╗████╗ ████║██║╚══██╔══╝
        ██║  ██║█████╗  ██║   ██║    ██████╔╝ ╚████╔╝     █████╔╝ █████╔╝ █████╗  ██████╔╝██╔████╔██║██║   ██║
        ██║  ██║██╔══╝  ╚██╗ ██╔╝    ██╔══██╗  ╚██╔╝      ██╔═██╗ ██╔═██╗ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║
        ██████╔╝███████╗ ╚████╔╝     ██████╔╝   ██║       ██║  ██╗██║  ██╗███████╗██║  ██║██║ ╚═╝ ██║██║   ██║
        ╚═════╝ ╚══════╝  ╚═══╝      ╚═════╝    ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝   ╚═╝    -->

<img align="center" alt="Discord Bot V14 Template banner" src="https://i.postimg.cc/Vv28NDm9/banner.png">

<p align="center">
  <a href="https://github.com/Kkkermit/DiscordBotV14-template/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Kkkermit/DiscordBotV14-template/ci.yml?branch=main&style=for-the-badge&label=CI"></a>
  <img alt="discord.js v14" src="https://img.shields.io/badge/discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white">
  <img alt="Node.js 22+" src="https://img.shields.io/badge/node.js-22%2B-339933?style=for-the-badge&logo=node.js&logoColor=white">
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/Kkkermit/DiscordBotV14-template?style=for-the-badge"></a>
  <img alt="Stars" src="https://img.shields.io/github/stars/Kkkermit/DiscordBotV14-template?style=for-the-badge">
</p>

<p align="center"><strong>A clean, beginner-friendly discord.js v14 bot template with slash commands, prefix commands and optional MongoDB.</strong></p>

<p align="center">
Start a new bot in minutes: add a file, restart, and your command is live. The template handles loading, validation,
cooldowns, permissions, errors, logging and graceful shutdown for you, so you can focus on what your bot does.
</p>

<p align="center">
  <a href="docs/getting-started.md">Getting started</a> •
  <a href="docs/commands.md">Writing commands</a> •
  <a href="docs/configuration.md">Configuration</a> •
  <a href="docs/deployment.md">Deployment</a> •
  <a href="https://discord.gg/xcMVwAVjSD">Support server</a>
</p>

<hr>

> ⭐ If this template helps you, please consider leaving a star. It shows us people value the project!

## Features

- **Slash and prefix commands** side by side, organised into category folders and loaded automatically.
- **Autocomplete, buttons and context menus** with working examples (`/help` autocomplete, `bot-info` refresh button).
- **Built-in command options**: per-user cooldowns, developer-only commands, required permissions and arguments.
- **Instant command updates while developing** by registering commands in a single test server.
- **Helpful errors**: invalid `.env` values, config mistakes and broken command files are reported with a clear message
  instead of a crash. Users see a friendly error, never your stack trace.
- **Optional MongoDB** through Mongoose. Leave the connection string empty and the bot runs without a database.
- **Production ready**: graceful shutdown, minimal gateway intents, safe mention defaults, Docker and Compose files.
- **Modern tooling**: Node.js 22+, ESLint, Prettier, the built-in Node.js test runner, GitHub Actions CI and
  Dependabot. No build step and no TypeScript required, but full editor IntelliSense through JSDoc types.

## Quick start

You need [Node.js 22.12 or newer](https://nodejs.org/) and a Discord application with a bot
([step-by-step guide](docs/getting-started.md#1-create-your-discord-bot)).

```bash
# 1. Get the code (or click "Use this template" / "Fork" on GitHub)
git clone https://github.com/Kkkermit/DiscordBotV14-template.git my-bot
cd my-bot

# 2. Install the dependencies
npm install

# 3. Create your .env file (asks for your token and validates every answer)
npm run setup

# 4. Start the bot
npm start
```

In the [Developer Portal](https://discord.com/developers/applications), turn on **Message Content Intent** under
**Bot → Privileged Gateway Intents** so prefix commands work, then
[invite the bot](docs/getting-started.md#3-invite-the-bot-to-your-server) to your server and try `/help` or `?help`.

> [!TIP]
> Set `DISCORD_GUILD_ID` to your test server's ID while developing. Slash commands then update instantly instead of
> taking up to an hour.

## Commands included

| Slash command | Prefix command                | Description                                        |
| ------------- | ----------------------------- | -------------------------------------------------- |
| `/help`       | `?help [command]` (`h`)       | Lists commands, or shows details about one.        |
| `/ping`       | `?ping` (`latency`)           | Shows the round trip and WebSocket latency.        |
| `/uptime`     | `?uptime` (`botuptime`)       | Shows how long the bot has been online.            |
| `/bot-info`   | `?bot-info` (`bi`, `botinfo`) | Bot statistics with a refresh button.              |
| `/user-info`  |                               | Information about a user and their server profile. |

The bot also introduces itself when someone sends a message that only mentions it, and `@YourBot ping` works as a
prefix too.

## Adding a command

Create a file in a category folder, for example `src/commands/slash/Fun/hello.js`:

```js
'use strict';

const { SlashCommandBuilder } = require('discord.js');

/** @type {import('../../../types').SlashCommand} */
module.exports = {
  data: new SlashCommandBuilder().setName('hello').setDescription('Say hello!'),
  cooldown: 5, // optional, in seconds

  async execute(interaction, client) {
    await interaction.reply(`Hello ${interaction.user}, I'm ${client.user.username}!`);
  },
};
```

Restart the bot and `/hello` is ready. Prefix commands work the same way in `src/commands/prefix/`. See
[Writing commands](docs/commands.md) for options, autocomplete, buttons, permissions and more.

## Project structure

```text
├── scripts/
│   ├── deploy-commands.js   # npm run deploy: register slash commands without starting the bot
│   └── setup-env.js         # npm run setup: interactive .env creator
├── src/
│   ├── commands/
│   │   ├── prefix/<Category>/*.js
│   │   └── slash/<Category>/*.js
│   ├── database/
│   │   ├── connection.js    # MongoDB connect / disconnect
│   │   └── models/          # Mongoose models (an example is included)
│   ├── events/<Category>/*.js
│   ├── handlers/            # Loads commands and events, handles process signals
│   ├── lib/                 # Logger, embeds, cooldowns, help, update checker, ...
│   ├── client.js            # BotClient: the discord.js Client with the template's helpers
│   ├── config.js            # Your bot's settings (prefix, colours, presence, messages, ...)
│   ├── env.js               # Loads and validates the .env file
│   ├── index.js             # Entry point
│   └── types.js             # JSDoc types for editor IntelliSense
├── test/                    # Tests for the Node.js test runner
├── .env.example             # Every environment variable, documented
├── compose.yaml / Dockerfile
└── package.json
```

Read [Architecture](docs/architecture.md) to see how a message or interaction flows through the bot.

## Scripts

| Command          | What it does                                                                |
| ---------------- | --------------------------------------------------------------------------- |
| `npm start`      | Starts the bot.                                                             |
| `npm run dev`    | Starts the bot and restarts it whenever you save a file.                    |
| `npm run setup`  | Creates your `.env` file interactively.                                     |
| `npm run deploy` | Registers slash commands. Add `-- --global` or `-- --clear` (see the docs). |
| `npm test`       | Runs the tests.                                                             |
| `npm run lint`   | Checks the code with ESLint. `npm run lint:fix` fixes what it can.          |
| `npm run format` | Formats the code with Prettier.                                             |
| `npm run check`  | Runs lint, the format check and the tests, like CI does.                    |

## Configuration

Secrets live in `.env` ([reference](docs/configuration.md#environment-variables)):

| Variable           | Required | Description                                                               |
| ------------------ | -------- | ------------------------------------------------------------------------- |
| `DISCORD_TOKEN`    | Yes      | Your bot token.                                                           |
| `DISCORD_GUILD_ID` | No       | Test server ID. Slash commands are registered there and update instantly. |
| `DEVELOPER_IDS`    | No       | Comma-separated user IDs allowed to use `developerOnly` commands.         |
| `MONGODB_URI`      | No       | MongoDB connection string. Leave empty to run without a database.         |
| `LOG_LEVEL`        | No       | `debug`, `info` (default), `warn` or `error`.                             |

Everything else (prefix, embed colour, status and activities, cooldowns, command logging channel, reply messages and
the update check) is in [`src/config.js`](src/config.js) and described in
[Configuration](docs/configuration.md#configjs).

## Documentation

- [Getting started](docs/getting-started.md): create the bot, invite it and run it for the first time.
- [Writing commands](docs/commands.md): slash and prefix commands, options, autocomplete, buttons, permissions.
- [Events](docs/events.md): react to anything that happens on Discord.
- [Configuration](docs/configuration.md): every `.env` variable and `config.js` setting.
- [Database](docs/database.md): using MongoDB and Mongoose models.
- [Deployment](docs/deployment.md): Docker, PM2 and command registration in production.
- [Architecture](docs/architecture.md): how the template works under the hood.
- [Troubleshooting](docs/troubleshooting.md): fixes for the most common problems.

## Upgrading from v3

Version 4 is a rewrite. The main changes are the new environment variable names, the `src/commands/slash` and
`src/commands/prefix` folders and the reorganised `config.js`. The [changelog](CHANGELOG.md#400) has a step-by-step
migration guide.

## Contributing

Contributions are welcome! Read the [contributing guide](CONTRIBUTING.md) to get started, and please follow the
[code of conduct](CODE_OF_CONDUCT.md). To report a security issue, see the [security policy](SECURITY.md).

## Support

Join the [Discord server](https://discord.gg/xcMVwAVjSD) for help or questions, or
[open an issue](https://github.com/Kkkermit/DiscordBotV14-template/issues/new/choose).

## License

Released under the [MIT License](LICENSE).

The original README design was inspired by [Nub Bot](https://github.com/TheLegenDev/Nub-Bot) by
[thelegendev](https://github.com/TheLegenDev). 💛
