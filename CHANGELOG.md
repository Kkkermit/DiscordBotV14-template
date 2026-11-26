# Changelog

All notable changes to this project are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 4.0.0

Version 4 is a rewrite of the template with modern discord.js, safer defaults, tests and full documentation.

### Breaking changes

- **Node.js 24 or newer** is required (Node.js 18 has reached end of life; 24 is the current LTS).
- **Environment variables are renamed:** `token` → `DISCORD_TOKEN`, `devid` → `DEVELOPER_IDS` (now a
  comma-separated list), `mongodb` → `MONGODB_URI`. `clientid` and the unused `guildid` are no longer needed.
- **Commands moved:** `src/commands/` → `src/commands/slash/` and `src/prefix/` → `src/commands/prefix/`.
  Category folders are lower case (`utility`); `/help` shows them capitalised.
- **Prefix command names and aliases** must be lower case. Users can still type them in any case.
- **Triggers are events now:** `src/triggers/` is gone. Put message listeners in `src/events/` instead.
- **`config.js` is reorganised** into groups (`banner`, `presence`, `commands`, `logging`, `updateCheck`, `messages`).
  `botVersion` is replaced by the `version` in `package.json`; `eventListeners`, `devBy` and `arrowEmoji` are removed.
- **Slash command logging** is disabled until you set `logging.commandLogChannelId`.
- The bot requests only the gateway intents it uses. Add the ones your features need in `src/client.js`.
- `client.commands`, `client.pcommands` and `client.aliases` are renamed to `client.slashCommands`,
  `client.prefixCommands` and `client.prefixAliases`.

### Added

- Command options: `cooldown`, `developerOnly`, and for prefix commands `description`, `usage`, `args` and
  `permissions`.
- `/help` with command details and autocomplete, `/user-info`, and prefix `help <command>`.
- Mentioning the bot works as a prefix (`@Bot ping`).
- Slash commands are not registered while a command file fails to load, so a typo can't delete a command from
  Discord.
- Validation of `.env` and `config.js` with clear startup errors, and of every command and event file.
- Graceful shutdown on `SIGINT`/`SIGTERM`, and handling of uncaught errors.
- A levelled logger with scopes, `LOG_LEVEL`, and `NO_COLOR`/`FORCE_COLOR` support.
- The bot's name is printed in ASCII art on startup with figlet; choose the font with `banner.font`.
- Dockerfile and Compose file with an optional MongoDB service.
- ESLint, Prettier, EditorConfig and a pre-commit hook (Husky and lint-staged) that formats staged files.
- Tests with the Node.js test runner and a coverage gate (`npm run test:coverage`).
- GitHub Actions: CI on Node.js 24 and 26, a release workflow that publishes a GitHub release and a Docker image
  to the GitHub Container Registry, CodeQL scanning, and Dependabot.
- Documentation in `docs/`, a contributing guide, code of conduct, security policy and issue templates.

### Fixed

- `guildCreate` and `guildDelete` received their arguments in the wrong order and always failed.
- Errors passed to `client.logs.error(message, error)` were silently dropped.
- The update check compared versions as text (so `v3.0.10` was older than `v3.0.9`) and claimed the bot was up to
  date when the check failed.
- `EventEmitter.setMaxListeners` was overwritten with a number.
- Errors in async prefix commands were not caught, and error replies failed when an interaction was already answered.
- Command logging used a hard-coded channel and logged an error for every command when it wasn't accessible.
- "Connected to MongoDB" was printed even when no database was configured.
- Mentions in the `<@!id>` format were not detected.
- The `refresh` button of `bot-info` worked forever and could be pressed by anyone.
- Deprecated discord.js and Mongoose options (`ephemeral`, `fetchReply`, `keepAlive`, `useNewUrlParser`...).

### Removed

- The `fs`, `path`, `axios`, `ascii-table` and `dotenv` dependencies. `.env` files are loaded by Node.js itself.
- Creating an invite to every server the bot joins.
- `/test` and the "Sent message in channel" pattern of the old `/ping` and `/bot-uptime` commands.

### Migrating from 3.x

1. Install Node.js 24 or newer.
2. Update your `.env` file with the new variable names (or run `npm run setup`).
3. Move your slash commands to `src/commands/slash/<category>/` and your prefix commands to
   `src/commands/prefix/<category>/`, with lower case folder names. Their shape is unchanged: slash commands export
   `data` and `execute(interaction, client)`, prefix commands export `name`, `aliases` and
   `execute(message, client, args)`.
4. Move files from `src/triggers/` to a folder in `src/events/`.
5. Replace `client.commands`, `client.pcommands` and `client.aliases` in your code with `client.slashCommands`,
   `client.prefixCommands` and `client.prefixAliases`, and `client.logs` with
   `const { logger } = require('../../lib/logger')`.
6. Copy your settings into the new `src/config.js`.
7. Replace `ephemeral: true` with `flags: MessageFlags.Ephemeral` in your own commands.
8. Move Mongoose schemas from `src/schemas/` to `src/database/models/`.
9. Run `npm run check`, start the bot and fix anything the startup checks report.

## 3.0.1 and earlier

See the [commit history](https://github.com/Kkkermit/DiscordBotV14-template/commits/main) and the
[releases page](https://github.com/Kkkermit/DiscordBotV14-template/releases).
