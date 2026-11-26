# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository. It explains what the project is, how it runs,
what every file does, the rules the code follows and how to make common changes safely.

**Keep this file up to date.** When you add, move, rename or delete a file, or change how something works, update the
matching section here in the same change.

## Project summary

A beginner-friendly **discord.js v14** bot template. People fork it to start their own bot, so the code must stay
simple, readable and well documented above all else.

| Topic           | Details                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- |
| Runtime         | Node.js **22.12+** (`engines` in `package.json`, enforced by `engine-strict` in `.npmrc`)   |
| Language        | JavaScript, **CommonJS** (`require` / `module.exports`). No build step, no TypeScript.      |
| Types           | Only a one-line `@type` hint on command exports, backed by `src/types.js`. No JSDoc blocks. |
| Dependencies    | `discord.js` 14, `mongoose` 9 (optional database), `figlet` (startup banner)                |
| Dev tooling     | ESLint 10 (flat config), Prettier 3, Husky + lint-staged (pre-commit), Node's test runner   |
| Entry point     | `src/index.js` (`npm start`)                                                                |
| Configuration   | Secrets in `.env` (validated by `src/env.js`), settings in `src/config.js` (validated too)  |
| Package version | `package.json` `version` is the template version, used by the banner and update checker     |

## Commands

| Command                 | Use it to                                                                      |
| ----------------------- | ------------------------------------------------------------------------------ |
| `npm install`           | Install dependencies. Also installs the pre-commit hook (`prepare` → `husky`). |
| `npm run setup`         | Create `.env` interactively (`scripts/setup-env.js`).                          |
| `npm start`             | Run the bot. Needs a real `DISCORD_TOKEN` and network access to Discord.       |
| `npm run dev`           | Run the bot with `node --watch`, restarting on file changes.                   |
| `npm test`              | Run every test (`node --test "test/**/*.test.js"`).                            |
| `npm run test:coverage` | Tests plus coverage. Fails below 85% lines, 80% branches, 80% functions.       |
| `npm run lint`          | ESLint. `npm run lint:fix` fixes what it can.                                  |
| `npm run format`        | Prettier on every file. `npm run format:check` only checks.                    |
| `npm run check`         | Lint, format check and tests: **run this before you finish any change.**       |

Run a single test file with `node --test test/lib/format.test.js`.

There is no network access to Discord in tests, and none is needed: tests use fakes (see [Testing](#testing)).
`npm start` without a valid token exits with code 1 and a clear message, which is expected.

## How the bot works

### Startup (`src/index.js`)

1. `loadEnv()` reads `.env` with Node's `process.loadEnvFile` (existing environment variables win) and validates it.
   On `EnvValidationError`, every issue is logged and the process exits with code 1.
2. `logger.setLevel(env.logLevel)`.
3. `validateConfig(config)` checks `src/config.js`. Any issue is logged as `src/config.js: <issue>` and exits with 1.
4. `new BotClient(env)` creates the Discord client (`src/client.js`).
5. `registerProcessHandlers(client)` handles SIGINT/SIGTERM, unhandled rejections and uncaught exceptions, and returns
   `shutdown(reason, exitCode)`.
6. `loadCommands(client)` and `loadEvents(client)` load every command and event file. Broken files are logged and
   skipped, never fatal.
7. If `MONGODB_URI` is set, `connectDatabase()` runs. Failure → logged hint, `shutdown(..., 1)`.
8. `client.login(token)`. Failure → `describeLoginError()` hint, `shutdown(..., 1)`.
9. Discord emits `clientReady` → `src/events/client/ready.js` sets the presence, **registers all slash commands
   globally** with `client.application.commands.set()`, prints the figlet banner and checks for updates.

### Slash and context menu commands (`src/events/interactions/interactionCreate.js`)

Autocomplete → `handleAutocomplete` (respects `developerOnly`, answers `[]` on errors). Chat input and context menu
commands → `handleCommand`: look up `client.slashCommands`, check `developerOnly`, check the cooldown with
`checkCooldown`, log the use (not awaited), run `command.execute(interaction, client)`. Errors are logged with the
command's file path and the user gets `messages.error` through `replyEphemeral` (uses `followUp` when already replied
or deferred). Buttons, select menus and modals are **not** routed here: commands handle them with collectors.

### Prefix commands (`src/events/messages/messageCreate.js`)

Ignores bots, webhooks, system messages and DMs. `parsePrefixCommand` matches the configured prefix (case-insensitive)
or a bot mention (if `commands.mentionAsPrefix`). Then, in order: unknown command (hint only for the text prefix and
word-like names), `developerOnly`, `permissions` (via `member.permissionsIn(channel)`), `args`, cooldown, log the use,
`command.execute(message, client, args)`. Every notice goes through `sendNotice`, which allows one notice per user per
5 seconds (`NOTICE_COOLDOWN_MS`) so spam can't make the bot spam.

### Shutdown (`src/handlers/processHandler.js`)

SIGINT/SIGTERM/uncaught exception → `shutdown()`: `client.destroy()`, close MongoDB only if connected, `process.exit`.
A timer forces exit after 8 s (below Docker's 10 s stop timeout). Unhandled rejections are only logged.

## File map

### Root

| File                                | Purpose                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                      | Scripts, dependencies, `engines`, and the `lint-staged` config (`*.js`: eslint --fix + prettier; others: prettier).          |
| `package-lock.json`                 | Locked dependency tree. Always commit it with dependency changes.                                                            |
| `.env.example`                      | Every environment variable with an explanation. Copy to `.env`. Keep in sync with `src/env.js`.                              |
| `eslint.config.js`                  | Flat config: `@eslint/js` recommended, Node globals, CommonJS, extra rules (see [Code style](#code-style)), prettier last.   |
| `.prettierrc.json`                  | Tabs (width 4), 120 columns, single quotes, trailing commas. Markdown and YAML use 2 spaces.                                 |
| `.prettierignore`                   | `node_modules/`, `coverage/`, `package-lock.json`.                                                                           |
| `.editorconfig`                     | Same indentation and LF line endings for editors without Prettier.                                                           |
| `.gitattributes`                    | Forces LF line endings in the repository.                                                                                    |
| `.gitignore`                        | Ignores `node_modules`, `.env*` (except `.env.example`), logs, coverage, editor files (keeps `.vscode` settings).            |
| `.npmrc`                            | `engine-strict=true`: installing on an unsupported Node.js version fails with a clear error.                                 |
| `.nvmrc`                            | `24`, the Node.js version for nvm and the CI lint job.                                                                       |
| `jsconfig.json`                     | Editor project settings for IntelliSense (Node 16 module resolution, JSON imports). Type checking is off.                    |
| `.husky/pre-commit`                 | Runs `npx lint-staged` on every commit.                                                                                      |
| `.vscode/settings.json`             | Format on save with Prettier, ESLint fix on save, LF line endings.                                                           |
| `.vscode/extensions.json`           | Recommends ESLint, Prettier and EditorConfig.                                                                                |
| `Dockerfile`                        | `node:24-alpine`, `npm ci --omit=dev --ignore-scripts`, copies `src` and `scripts`, runs as `node`, `CMD node src/index.js`. |
| `.dockerignore`                     | Keeps `.env`, `node_modules`, `.git`, tests, docs and Markdown out of the image.                                             |
| `compose.yaml`                      | `bot` service (reads `.env`, restarts, `init: true`) and an optional `mongo:8` service under the `database` profile.         |
| `README.md`                         | Project overview, quick start, features, structure, scripts, configuration.                                                  |
| `CHANGELOG.md`                      | Keep a Changelog format. Add entries under `## Unreleased`. Release notes are taken from here.                               |
| `CONTRIBUTING.md`                   | Contributor guide: setup, checks, code style, commit messages, pull requests.                                                |
| `CODE_OF_CONDUCT.md`, `SECURITY.md` | Contributor Covenant 2.1; how to report vulnerabilities privately.                                                           |
| `LICENSE`                           | MIT.                                                                                                                         |
| `AGENTS.md`                         | This file.                                                                                                                   |

### `.github/`

| File                                 | Purpose                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workflows/ci.yml`                   | On push to `main` and pull requests (and reusable via `workflow_call`): lint + format check, `test:coverage` on Node 22.x and 24.x, Docker build. |
| `workflows/release.yml`              | On `v*.*.*` tags: runs CI, checks the tag equals `package.json` version, creates a GitHub release from `CHANGELOG.md`, pushes the image to GHCR.  |
| `workflows/codeql.yml`               | CodeQL security scan on push, pull requests and weekly.                                                                                           |
| `dependabot.yml`                     | Weekly npm updates (dev dependencies grouped, `lint-staged >= 17` ignored because it needs Node 22.22+), monthly GitHub Actions updates.          |
| `ISSUE_TEMPLATE/bug_report.yml`      | Bug report form (version, Node.js version, OS, logs; warns not to paste tokens).                                                                  |
| `ISSUE_TEMPLATE/feature_request.yml` | Feature request form.                                                                                                                             |
| `ISSUE_TEMPLATE/config.yml`          | Disables blank issues; links to the Discord server and the discord.js docs.                                                                       |
| `PULL_REQUEST_TEMPLATE.md`           | Pull request summary, type of change and checklist (`npm run check`, tests, docs, changelog).                                                     |

### `docs/`

User guides: `getting-started.md`, `commands.md`, `events.md`, `configuration.md`, `database.md`, `deployment.md`
(including releases), `architecture.md`, `troubleshooting.md`. `docs/assets/` holds `banner.svg` (README banner) and
`console.png` (screenshot of the startup console). Update the guides whenever behaviour, settings or commands change.

### `scripts/`

| File           | Purpose                                                                                                                                                                                                                                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setup-env.js` | `npm run setup`. Asks for each field in `FIELDS` (`DISCORD_TOKEN` required; `DEVELOPER_IDS`, `MONGODB_URI` optional), validates each answer with `parseEnv` (`validateField`), writes `.env` (`buildEnvFile`, `formatEnvValue` quotes values safely) and `chmod 600`s it. Asks before overwriting. Exports the pure helpers for tests. |

### `src/` top level

| File        | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.js`  | Startup sequence (see above). `describeLoginError` turns login failures into hints.                                                                                                                                                                                                                                                                                                                                                           |
| `client.js` | `BotClient extends Client`. Intents: `Guilds`, `GuildMessages`, `MessageContent`. `allowedMentions: { parse: ['users'], repliedUser: true }`. Properties: `env`, `config`, `slashCommands`, `prefixCommands`, `prefixAliases`, `failedSlashCommandFiles`, `cooldowns`, `cooldownSweepTimer` (60 s, unref'd), `presenceTimer`. Methods: `getPrefixCommand(nameOrAlias)`, `countMembers()`, `isDeveloper(userId)`, `destroy()` (clears timers). |
| `config.js` | User settings: `prefix`, `embedColor`, `developerName`, `banner { enabled, font }`, `presence { status, rotateIntervalSeconds, activities }`, `commands { defaultCooldownSeconds, mentionAsPrefix, replyToUnknownCommands }`, `logging { commandLogChannelId }`, `updateCheck { enabled, repository }`, `messages { error, noPermission, developerOnly, cooldown, missingArgs, unknownCommand }` with `{placeholders}`.                       |
| `env.js`    | `ENV_FILE_PATH`, `EnvValidationError` (`issues: string[]`), `loadEnvFile()`, `parseEnv(source)` → frozen `{ token, developerIds, mongoUri, logLevel }`, `loadEnv()`. Variables: `DISCORD_TOKEN` (required), `DEVELOPER_IDS`, `MONGODB_URI`, `LOG_LEVEL`.                                                                                                                                                                                      |
| `types.js`  | The `SlashCommand`, `ContextMenuCommand` and `PrefixCommand` types used by the `@type` hint in command files. No runtime code.                                                                                                                                                                                                                                                                                                                |

### `src/commands/`

Loaded recursively. The first folder below `slash/` or `prefix/` is the category (lower case on disk, capitalised in
`/help`). Files directly in `slash/` or `prefix/` get the `General` category. Files and folders starting with `_` are
skipped, so shared helpers can live next to commands.

| File                       | Command                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `slash/utility/ping.js`    | `/ping`: replies with `withResponse`, then edits in round trip and WebSocket latency. Cooldown 5 s.                                      |
| `slash/utility/uptime.js`  | `/uptime`: `formatDuration(client.uptime)` and `client.readyAt`.                                                                         |
| `slash/utility/help.js`    | `/help [command]`: list (`createSlashHelpEmbed`) or details (`createSlashCommandEmbed`). Autocomplete of visible command names (max 25). |
| `slash/info/bot-info.js`   | `/bot-info`: `createBotInfoPayload` + `collectRefreshClicks` (refresh button for 60 s, only the caller can press it). Cooldown 10 s.     |
| `slash/info/user-info.js`  | `/user-info [user]`: account info, plus server details (joined, nickname, roles via `formatRoles`, max 15) when the user is a member.    |
| `prefix/utility/ping.js`   | `?ping` (`latency`). Cooldown 5 s.                                                                                                       |
| `prefix/utility/uptime.js` | `?uptime` (`botuptime`).                                                                                                                 |
| `prefix/utility/help.js`   | `?help [command]` (`h`, `commands`). Unknown names are echoed without backticks and with `allowedMentions: { parse: [] }`.               |
| `prefix/info/bot-info.js`  | `?bot-info` (`bi`, `botinfo`), same refresh button as the slash version. Cooldown 10 s.                                                  |

### `src/events/`

Loaded recursively. Every file exports `{ name, once?, execute }`; `execute` receives the event's arguments **followed by the
client**.

| File                                | Event               | Purpose                                                                                                                  |
| ----------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `client/ready.js`                   | `clientReady` once  | Presence, global slash command registration (skipped while `failedSlashCommandFiles` isn't empty), banner, update check. |
| `client/error.js`                   | `error`             | Logs client errors (without a listener Node would crash).                                                                |
| `client/warn.js`                    | `warn`              | Logs client warnings.                                                                                                    |
| `guilds/guildCreate.js`             | `guildCreate`       | Logs joined servers.                                                                                                     |
| `guilds/guildDelete.js`             | `guildDelete`       | Logs servers the bot was removed from.                                                                                   |
| `interactions/interactionCreate.js` | `interactionCreate` | Runs slash/context menu commands and autocomplete (see above).                                                           |
| `messages/messageCreate.js`         | `messageCreate`     | Runs prefix commands (see above).                                                                                        |
| `messages/mention.js`               | `messageCreate`     | Introduces the bot when a message is only a mention of it (`<@id>` or `<@!id>`).                                         |

### `src/handlers/`

| File                | Exports and behaviour                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `commandHandler.js` | `validateSlashCommand`, `validatePrefixCommand` (return a message or `null`), `loadSlashCommands(dir)`, `loadPrefixCommands(dir)` (also builds aliases; a name always beats an alias, conflicting aliases become `warnings`), `loadCommands(client)` (sets the client collections and `failedSlashCommandFiles`, logs results). Shared loop: `loadCommandFiles`. Each loaded command gains `category` and `filePath`. |
| `eventHandler.js`   | `validateEvent`, `loadEvents(client, dir)`: wraps every `execute` in a try/catch that logs errors with the file name, warns about names that aren't discord.js `Events`, returns the count.                                                                                                                                                                                                                           |
| `processHandler.js` | `registerProcessHandlers(client)` → `{ shutdown }` (see [Shutdown](#shutdown-srchandlersprocesshandlerjs)).                                                                                                                                                                                                                                                                                                           |

### `src/lib/`

| File                | Exports and behaviour                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `logger.js`         | `logger` (app-wide `Logger`), `Logger` (`setLevel`, `child(label)`, `debug/info/success/warn/error`), `LEVEL_NAMES`, `supportsColor(stream)` (NO_COLOR/FORCE_COLOR/TTY), `colorize(style, text, enabled)` (`util.styleText`), `formatTimestamp`. Writes everything to stdout.                                                                                    |
| `banner.js`         | `renderAsciiArt(text, font, width)` (figlet, falls back to plain text), `printBanner(client, stream)` (bot name + summary).                                                                                                                                                                                                                                      |
| `botInfo.js`        | `createBotInfoEmbed`, `createBotInfoPayload` (embed + refresh button `bot-info:refresh`), `collectRefreshClicks({ message, userId, client, edit })`.                                                                                                                                                                                                             |
| `commandLogger.js`  | `logCommandUsage(client, { type, command, user, guild })`: console log, plus an embed in `logging.commandLogChannelId`. Pauses a channel that isn't a text channel or that Discord rejects (`DiscordAPIError`) until restart; never throws.                                                                                                                      |
| `constants.js`      | `SNOWFLAKE_PATTERN` (17–20 digit Discord IDs).                                                                                                                                                                                                                                                                                                                   |
| `cooldowns.js`      | `CooldownManager` (`consume(key, userId, ms, now)` → remaining ms or 0, `sweep(now)`, `size`), `checkCooldown(client, key, userId, seconds)` → cooldown message or `null`.                                                                                                                                                                                       |
| `embeds.js`         | `createEmbed(client)` (colour + footer), `createNoticeEmbed(text, color = 'Red')`.                                                                                                                                                                                                                                                                               |
| `files.js`          | `findJsFiles(dir)` (recursive, sorted, skips `_` paths), `getCategory(baseDir, file)` (capitalised first folder or `General`).                                                                                                                                                                                                                                   |
| `format.js`         | `formatDuration(ms)`, `truncate(text, max)`, `joinLines(lines, max)` (drops whole lines, adds "…and N more"), `formatMessage(template, values)`, `escapeCodeBlock(text)`.                                                                                                                                                                                        |
| `help.js`           | `getVisibleCommands(client, userId, commands)` (hides `developerOnly`), `createSlashHelpEmbed`, `createSlashCommandEmbed`, `createPrefixHelpEmbed`, `createPrefixCommandEmbed`. Keeps embeds under Discord limits (25 fields, 1024 per field, 4500-character budget for lists). Slash names become clickable mentions using `client.application.commands.cache`. |
| `prefix.js`         | `getPrefixes(client)` (prefix + mention forms, longest first), `parsePrefixCommand(content, prefixes)` → `{ prefix, name, args }` or `null`.                                                                                                                                                                                                                     |
| `presence.js`       | `startPresenceRotation(client)`: sets status, rotates `presence.activities` every `rotateIntervalSeconds`. `name` may be a function of the client.                                                                                                                                                                                                               |
| `replies.js`        | `replyEphemeral(interaction, options)`: reply or followUp with `MessageFlags.Ephemeral`.                                                                                                                                                                                                                                                                         |
| `updateChecker.js`  | `parseVersion`, `compareVersions` (numeric major.minor.patch), `fetchLatestReleaseTag(repo, fetch)`, `checkForUpdates({ repository, version, fetch })` → `'outdated'                                                                                                                                                                                             | 'latest' | 'unknown'`; never throws. |
| `validateConfig.js` | `validateConfig(config)` → list of problems (prefix, colour, banner font via `figlet.fontsSync()`, presence status/interval ≥ 15 s/activities, command options, log channel ID, update repository, messages).                                                                                                                                                    |

### `src/database/`

| File                      | Purpose                                                                                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connection.js`           | `connectDatabase(uri)` (10 s server selection timeout, attaches reconnect/error logging after the first connection), `disconnectDatabase()`, `isDatabaseConnected()`. |
| `models/GuildSettings.js` | Example Mongoose model (`guildId` unique, `welcomeChannelId`, timestamps). Not used by the bundled commands.                                                          |

### `test/`

Tests mirror `src/`: the test for `src/lib/format.js` is `test/lib/format.test.js`.

| File                               | Covers                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `helpers/fakes.js`                 | Shared fakes (see [Testing](#testing)). Sets the logger to `error` so test output stays readable.                                                       |
| `startup.test.js`                  | Runs `src/index.js` as a child process with invalid environment variables and checks the messages.                                                      |
| `env.test.js`                      | `parseEnv` and `loadEnvFile`.                                                                                                                           |
| `commands/bundled.test.js`         | Runs every bundled command against fakes, including `/help` limits and the refresh button.                                                              |
| `events/interactionCreate.test.js` | Slash routing, unknown commands, `developerOnly`, cooldowns, `followUp` after errors, autocomplete guard and errors.                                    |
| `events/messageCreate.test.js`     | Arguments, aliases and mention prefix, ignored senders, unknown-command hints, notice throttling, permissions, `args`, cooldowns, errors.               |
| `events/mention.test.js`           | The mention reply and when it stays quiet.                                                                                                              |
| `events/ready.test.js`             | Global registration with `commands.set()` and the broken-file guard.                                                                                    |
| `handlers/commandHandler.test.js`  | The bundled commands load cleanly; validators; categories, `_` files, broken files and duplicates (temporary fixture folders); aliases; `loadCommands`. |
| `handlers/eventHandler.test.js`    | `validateEvent`; the bundled events register; listeners catch errors and receive the client last.                                                       |
| `handlers/processHandler.test.js`  | `shutdown` closes the client, runs once and exits with the right code (`process.exit` mocked).                                                          |
| `lib/banner.test.js`               | figlet rendering, wrapping, the plain-text fallback and the printed summary.                                                                            |
| `lib/commandLogger.test.js`        | Log channel embeds with mentions disabled and escaping, pausing after Discord errors, retrying after network errors.                                    |
| `lib/cooldowns.test.js`            | `CooldownManager.consume` and `sweep`.                                                                                                                  |
| `lib/format.test.js`               | `formatDuration`, `truncate`, `joinLines`, `formatMessage`, `escapeCodeBlock`.                                                                          |
| `lib/logger.test.js`               | Output format, ordering, colours, error stacks, levels shared with children, `supportsColor`.                                                           |
| `lib/prefix.test.js`               | `parsePrefixCommand` and `getPrefixes`.                                                                                                                 |
| `lib/presence.test.js`             | Activity rotation with mocked timers.                                                                                                                   |
| `lib/updateChecker.test.js`        | Version parsing and comparison, fetching releases, `checkForUpdates` results.                                                                           |
| `lib/validateConfig.test.js`       | The default config is valid; each kind of mistake is reported.                                                                                          |
| `scripts/setup-env.test.js`        | `formatEnvValue`, `validateField`, and that the written `.env` parses back correctly.                                                                   |

## Contracts

### Slash command (`src/commands/slash/<category>/<name>.js`)

```js
const { SlashCommandBuilder } = require('discord.js');

/** @type {import('../../../types').SlashCommand} */
module.exports = {
  data: new SlashCommandBuilder().setName('name').setDescription('What it does.'), // required
  cooldown: 5, // optional, seconds; defaults to config.commands.defaultCooldownSeconds
  developerOnly: false, // optional; only DEVELOPER_IDS may use it
  async autocomplete(interaction, client) {}, // optional; for options with .setAutocomplete(true)
  async execute(interaction, client) {}, // required
};
```

`validateSlashCommand` rejects files without `data.toJSON`, whose `data.toJSON()` throws, or with a non-function
`execute`/`autocomplete`, a negative `cooldown` or a non-boolean `developerOnly`. Names are unique across files.
Context menu commands use `ContextMenuCommandBuilder` in the same folder and the `ContextMenuCommand` type.

### Prefix command (`src/commands/prefix/<category>/<name>.js`)

```js
/** @type {import('../../../types').PrefixCommand} */
module.exports = {
  name: 'name', // required, one lower case word
  description: 'Shown in ?help.',
  aliases: ['n'], // lower case words
  usage: '<text>', // shown in ?help and when args are missing
  args: true, // require at least one argument
  permissions: [PermissionFlagsBits.ManageMessages], // member permissions in the channel
  cooldown: 5,
  developerOnly: false,
  async execute(message, client, args) {}, // required
};
```

### Event (`src/events/<category>/<name>.js`)

```js
module.exports = {
  name: Events.GuildMemberAdd, // use the discord.js Events enum
  once: false, // optional
  async execute(member, client) {}, // event arguments first, client last
};
```

## Code style

- **Formatting is Prettier's job.** Tabs, single quotes, 120 columns, trailing commas. The pre-commit hook formats
  staged files; run `npm run format` if needed. Don't hand-format against Prettier.
- **ESLint rules** beyond the recommended set: `curly` (multi-line), `eqeqeq`, `no-implicit-globals`,
  `no-unused-vars` (prefix unused arguments with `_`), `no-var`, `object-shorthand`, `prefer-const`,
  `prefer-template`. Unused `eslint-disable` comments are errors.
- **CommonJS without `'use strict'`.** Use `require` / `module.exports`; Node built-ins with the `node:` prefix.
- **Readability first.** This is a template for beginners: prefer plain, explicit code over clever abstractions.
  Small named helpers beat nested ternaries. Use descriptive names.
- **Few, short comments.** No JSDoc blocks and no `@param` / `@returns` tags: they confuse beginners. Add a one- or
  two-line `//` comment only when the code needs a reason (why something is done, a Discord limit, a gotcha). The
  only JSDoc allowed is the one-line `/** @type {import('../../../types').SlashCommand} */` hint above a command's
  `module.exports`, which gives autocompletion. `src/config.js` keeps a short `//` comment per setting.
- **Naming:** folders lower case; command files kebab-case named after the command (`bot-info.js`); event files
  named after the event (`messageCreate.js`); library files camelCase (`commandLogger.js`); Mongoose models
  PascalCase (`GuildSettings.js`); scripts kebab-case.
- **Logging:** use `logger.child('Label')` from `src/lib/logger.js`, never `console.log` (except `scripts/` prompts).
  Pass errors as extra arguments (`log.error('Could not do X:', error)`) so the stack is printed.
- **discord.js:** use enums (`Events`, `PermissionFlagsBits`, `MessageFlags`, `ActivityType`, `TimestampStyles`) and
  current APIs (`flags: MessageFlags.Ephemeral`, `withResponse: true`). Don't use deprecated options such as
  `ephemeral`, `fetchReply` or `TimestampStyles.LongDateTime`.
- **User-facing text:** friendly, never a stack trace. Configurable replies live in `config.messages`.
- **Safety:** when echoing user input, pass `allowedMentions: { parse: [] }` and keep it out of code blocks
  (`escapeCodeBlock`). Keep embeds within Discord limits.
- **Dependencies:** only add one when it clearly helps the template. Check its `engines` against Node 22.12.

## Common tasks

| Task                     | What to change                                                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a slash command      | New file in `src/commands/slash/<category>/`. Add a test in `test/commands/`. Update the command table in `README.md` if it ships with the template.                             |
| Add a prefix command     | New file in `src/commands/prefix/<category>/`. Name and aliases lower case and unique.                                                                                           |
| Add an event             | New file in `src/events/<category>/`. If it needs another gateway intent, add it in `src/client.js` and document it in `docs/events.md`.                                         |
| Add a `config.js` option | `src/config.js` (with a comment), a check in `src/lib/validateConfig.js`, a test in `test/lib/validateConfig.test.js`, and `docs/configuration.md`.                              |
| Add an env variable      | `parseEnv` and the `Env` typedef in `src/env.js`, `.env.example`, `FIELDS` in `scripts/setup-env.js` if users should be asked, tests, `docs/configuration.md`, the README table. |
| Add a helper             | `src/lib/<name>.js` plus `test/lib/<name>.test.js`. Document it in `docs/commands.md` ("Useful helpers") if command authors should use it.                                       |
| Add a Mongoose model     | `src/database/models/<Name>.js`. Check `isDatabaseConnected()` in commands that need it, since the database is optional.                                                         |
| Change behaviour         | Update tests, the relevant `docs/` guide, `README.md` if affected, and add a line under `## Unreleased` in `CHANGELOG.md`.                                                       |

## Testing

Tests use `node:test` and `node:assert/strict`. There is no mocking library: use the fakes and `t.mock`.

`test/helpers/fakes.js` exports:

- `BOT_ID`, `USER_ID`, `DEVELOPER_ID` (listed in `developerIds`), `GUILD_ID`.
- `createClient(env?)`: a real `BotClient` that never logs in, with the bundled commands loaded, a fake bot user
  named `TemplateBot` and `readyTimestamp` 90 s ago. Always `t.after(() => client.destroy())`.
- `createMessage(content, { authorId, permissions })`: a guild message. Replies are recorded in `message.replies`;
  `reply()` returns a fake sent message with `edit()` and `createMessageComponentCollector()` (an `EventEmitter`).
- `createInteraction(name, { userId, options, focused })`: records `replies`, `followUps`, `edits`, `responses` and
  `sentMessage`. Set `interaction.autocomplete = true` to make it an autocomplete interaction.
- `createUser(id, username?)`.

Patterns used in the suite:

- Temporary folders (`fs.mkdtempSync`) with fixture files to test the loaders; clean up with `t.after`.
- `t.mock.timers.enable({ apis: ['setInterval'] })` for presence rotation; `t.mock.method(process, 'exit')` for
  shutdown; a replaced `client.application.commands.set` for registration; an injected `fetch` for the update checker.
- `test/startup.test.js` sets environment variables to `''` so a developer's own `.env` can't fill them in.
- Never call the real Discord API or require network access in tests.

`npm run test:coverage` must stay above the thresholds in `package.json`. `src/database/connection.js` is the least
covered module, because testing it needs a real MongoDB server.

## CI/CD and releases

- **CI** (`.github/workflows/ci.yml`): `npm ci`, `npm run lint`,
  `npm run format:check`, `npm run test:coverage` on Node 22.x and 24.x, and a Docker build.
- **Release** (`.github/workflows/release.yml`): `npm version <patch|minor|major>` then `git push --follow-tags`.
  The tag must match `package.json`. Write the `## <version>` section in `CHANGELOG.md` first: its content becomes the
  release notes. The image is pushed to `ghcr.io/<owner>/<repo>` with full, minor and major version tags.
- **CodeQL** (`.github/workflows/codeql.yml`) and **Dependabot** (`.github/dependabot.yml`) run automatically.

## Important rules and gotchas

- **Slash commands are registered globally on every start** with `client.application.commands.set()`, which replaces
  Discord's whole list. That's why nothing is registered while a command file fails to load
  (`client.failedSlashCommandFiles`): it would delete that command from Discord. Keep this guard.
- **Command and alias names are lower case.** The loader rejects anything else; users can type any case.
- **Event `execute` gets the client last**, after the event's own arguments.
- **One stream for logs.** The logger writes every level to stdout so Docker and PM2 keep the order. Don't log to
  stderr.
- **`.env` is never committed.** Don't create or print real tokens. `.env.example` documents every variable.
- **Node version:** keep everything compatible with Node 22.12. `lint-staged` stays on v16 for this reason.
- **The `prepare` script is `husky || true`** so production installs without dev dependencies don't fail. The
  Dockerfile also uses `--ignore-scripts`.
- **Banner fonts** come from figlet; `validateConfig` rejects unknown fonts.
- **Presence updates** are rate-limited by Discord; `rotateIntervalSeconds` must be `0` or at least 15.
- **Prefix notices** (unknown command, cooldown, missing permissions...) are limited to one per user every 5 seconds.
- **Optional database:** the bot must keep working when `MONGODB_URI` is empty.
- **Docs are part of the change.** Behaviour, settings or file changes need matching updates in `docs/`, `README.md`,
  `CHANGELOG.md` and this file.
