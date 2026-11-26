// Types for editor autocompletion. The "@type" line above `module.exports` in each command file points here,
// so VS Code knows what `interaction`, `message` and `client` are. This file has no code that runs.

/**
 * @typedef {object} SlashCommand
 * @property {{ name: string, description?: string, toJSON(): object }} data
 * @property {(interaction: import('discord.js').ChatInputCommandInteraction, client: import('./client').BotClient) => Promise<unknown>} execute
 * @property {(interaction: import('discord.js').AutocompleteInteraction, client: import('./client').BotClient) => Promise<unknown>} [autocomplete]
 * @property {number} [cooldown]
 * @property {boolean} [developerOnly]
 */

/**
 * @typedef {object} ContextMenuCommand
 * @property {{ name: string, toJSON(): object }} data
 * @property {(interaction: import('discord.js').ContextMenuCommandInteraction, client: import('./client').BotClient) => Promise<unknown>} execute
 * @property {number} [cooldown]
 * @property {boolean} [developerOnly]
 */

/**
 * @typedef {object} PrefixCommand
 * @property {string} name
 * @property {(message: import('discord.js').Message<true>, client: import('./client').BotClient, args: string[]) => Promise<unknown>} execute
 * @property {string} [description]
 * @property {string[]} [aliases]
 * @property {string} [usage]
 * @property {boolean} [args]
 * @property {import('discord.js').PermissionResolvable} [permissions]
 * @property {number} [cooldown]
 * @property {boolean} [developerOnly]
 */

module.exports = {};
