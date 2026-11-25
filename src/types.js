'use strict';

/*
 * Shared type definitions used for editor IntelliSense (VS Code reads these JSDoc types automatically).
 * Annotate your command and event exports with them, like the bundled commands do, to get
 * autocompletion and inline docs for `interaction`, `message`, `client` and every option.
 *
 * This file contains no runtime code.
 */

/**
 * @typedef {import('./client').BotClient} BotClient
 */

/**
 * A slash command in `src/commands/slash/<Category>/<name>.js`.
 *
 * @typedef {object} SlashCommand
 * @property {{ name: string, description?: string, toJSON(): import('discord.js').RESTPostAPIApplicationCommandsJSONBody }} data
 *   The command definition, built with `SlashCommandBuilder`.
 * @property {(interaction: import('discord.js').ChatInputCommandInteraction, client: BotClient) => Promise<unknown>} execute
 *   Runs when someone uses the command.
 * @property {(interaction: import('discord.js').AutocompleteInteraction, client: BotClient) => Promise<unknown>} [autocomplete]
 *   Runs while someone types an option that has `.setAutocomplete(true)`.
 * @property {number} [cooldown] Seconds a user must wait between uses. Defaults to `config.commands.defaultCooldownSeconds`.
 * @property {boolean} [developerOnly] Only users listed in `DEVELOPER_IDS` may use the command.
 */

/**
 * A context menu command (right-click on a user or message) in `src/commands/slash/<Category>/<name>.js`,
 * built with `ContextMenuCommandBuilder`. It supports the same `cooldown` and `developerOnly` options.
 *
 * @typedef {object} ContextMenuCommand
 * @property {{ name: string, toJSON(): import('discord.js').RESTPostAPIApplicationCommandsJSONBody }} data
 * @property {(interaction: import('discord.js').ContextMenuCommandInteraction, client: BotClient) => Promise<unknown>} execute
 * @property {number} [cooldown]
 * @property {boolean} [developerOnly]
 */

/**
 * A prefix (message) command in `src/commands/prefix/<Category>/<name>.js`.
 *
 * @typedef {object} PrefixCommand
 * @property {string} name The word typed after the prefix, e.g. `ping` for `?ping`.
 * @property {(message: import('discord.js').Message<true>, client: BotClient, args: string[]) => Promise<unknown>} execute
 *   Runs when someone uses the command. `args` holds the words typed after the command name.
 * @property {string} [description] Shown in the help command.
 * @property {string[]} [aliases] Other names that run the command, e.g. `['p']`.
 * @property {string} [usage] How to use the command, without the prefix and name, e.g. `<user> [reason]`.
 * @property {boolean} [args] Require at least one argument. The usage is shown when none are given.
 * @property {import('discord.js').PermissionResolvable} [permissions] Permissions the member needs, e.g. `[PermissionFlagsBits.ManageMessages]`.
 * @property {number} [cooldown] Seconds a user must wait between uses. Defaults to `config.commands.defaultCooldownSeconds`.
 * @property {boolean} [developerOnly] Only users listed in `DEVELOPER_IDS` may use the command.
 */

/**
 * An event listener in `src/events/<Category>/<name>.js`.
 * `execute` receives the event's arguments followed by the client.
 *
 * @typedef {object} BotEvent
 * @property {string} name The event name, e.g. `Events.MessageCreate`.
 * @property {boolean} [once] Run only the first time the event fires.
 * @property {(...args: any[]) => Promise<unknown> | unknown} execute
 */

module.exports = {};
