# Architecture

A short tour of how the template works, for when you want to change how it behaves rather than just add commands.

## Startup

[`src/index.js`](../src/index.js) runs these steps in order, stopping with a clear message if one fails:

1. **Load and validate the environment** ([`src/env.js`](../src/env.js)). Reads `.env` with Node's built-in loader
   and checks every variable, reporting all problems at once.
2. **Validate `config.js`** ([`src/lib/validateConfig.js`](../src/lib/validateConfig.js)).
3. **Create the client** ([`src/client.js`](../src/client.js)). `BotClient` extends the discord.js `Client` with the
   template's collections (`slashCommands`, `prefixCommands`, `prefixAliases`), the cooldown manager, the config and
   helpers such as `isDeveloper()`.
4. **Register process handlers** ([`src/handlers/processHandler.js`](../src/handlers/processHandler.js)) for
   graceful shutdown and uncaught errors.
5. **Load commands and events** ([`src/handlers/`](../src/handlers)). Each file is validated; broken files are logged
   and skipped.
6. **Connect to MongoDB** if `MONGODB_URI` is set.
7. **Log in to Discord.** When the connection is ready, the [`shardReady` event](../src/events/client/shardReady.js)
   sets the bot's status, and the [`ready` event](../src/events/client/ready.js) registers the slash commands, prints
   the banner and checks for updates.

## A slash command, step by step

1. Discord sends an interaction. discord.js emits `interactionCreate`.
2. [`events/interactions/interactionCreate.js`](../src/events/interactions/interactionCreate.js) looks up the command
   in `client.slashCommands`.
3. It checks `developerOnly`, then the cooldown.
4. It logs the use (console, plus the log channel if configured) and runs `command.execute(interaction, client)`.
5. If `execute` throws, the error is logged with the file name and the user gets the `messages.error` reply, using
   `followUp` if the command had already replied.

Autocomplete interactions go to `command.autocomplete`. Buttons and select menus are handled by collectors in the
command that created them.

## A prefix command, step by step

1. [`events/messages/messageCreate.js`](../src/events/messages/messageCreate.js) ignores bots, webhooks, system
   messages and DMs.
2. [`lib/prefix.js`](../src/lib/prefix.js) checks for the prefix (or a mention of the bot) and splits the message into
   a command name and arguments.
3. The command is found by name or alias, then the handler checks `developerOnly`, `permissions`, `args` and the
   cooldown, in that order.
4. It logs the use and runs `command.execute(message, client, args)`, with the same error handling as slash commands.

## Shutdown

`SIGINT` (Ctrl+C) and `SIGTERM` (Docker, PM2, hosting panels) close the Discord connection and the database, then
exit. If that takes longer than 8 seconds the process exits anyway. An uncaught exception is logged and triggers the
same shutdown, because Node.js can't safely continue after one; let a process manager restart the bot. Unhandled
promise rejections are logged and the bot keeps running.

## Folder overview

| Path                   | Contents                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `src/commands/slash/`  | Slash and context menu commands, one folder per category.                                  |
| `src/commands/prefix/` | Prefix commands, one folder per category.                                                  |
| `src/events/`          | Event listeners, grouped by topic.                                                         |
| `src/handlers/`        | Loading commands and events, process signals.                                              |
| `src/lib/`             | Reusable helpers: logger, embeds, help, cooldowns, formatting, update checker...           |
| `src/database/`        | MongoDB connection and Mongoose models.                                                    |
| `scripts/`             | `npm run setup` (creates `.env`) and the release helpers.                                  |
| `test/`                | Tests, in the same folders as the code they test (`test/lib/format.test.js`...).           |
| `.github/workflows/`   | CI, release, branch rules and CodeQL pipelines.                                            |
| `.github/rulesets/`    | Branch and tag protection to import on GitHub (see [releases](branching-and-releases.md)). |

## Testing

Tests use the built-in [Node.js test runner](https://nodejs.org/api/test.html), so there's nothing extra to install.
A test lives at the same path as the code it tests: `src/lib/format.js` is tested by `test/lib/format.test.js`.
[`test/startup.test.js`](../test/startup.test.js) starts the real bot with bad settings to check its error
messages.

```bash
npm test                # Run every test
npm run test:coverage   # Also report which lines are tested; fails if coverage drops below the thresholds
node --test test/lib/format.test.js   # Run a single file
```

[`test/helpers/fakes.js`](../test/helpers/fakes.js) creates a real `BotClient` that never logs in, plus fake messages
and interactions that record every reply. That makes it possible to test commands without a Discord connection:

```js
// test/commands/roll.test.js
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createClient, createInteraction } = require('../helpers/fakes');

describe('/roll', () => {
  it('replies with a number', async (t) => {
    const client = createClient();
    t.after(() => client.destroy());
    const interaction = createInteraction('roll');

    await client.slashCommands.get('roll').execute(interaction, client);
    assert.match(interaction.replies[0], /You rolled a \*\*\d+\*\*/);
  });
});
```

Add your own fakes (for example `options.getInteger`) to the helper as your commands need them.
