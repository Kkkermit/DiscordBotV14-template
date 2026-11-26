'use strict';

const figlet = require('figlet');
const { version } = require('../../package.json');
const { colorize, supportsColor } = require('./logger');

/**
 * Draws text as ASCII art. Falls back to the plain text if the font has none of its characters
 * (figlet fonts only cover basic Latin letters, so a name made of emoji or other scripts would be empty).
 *
 * @param {string} text
 * @param {string} font A figlet font name, e.g. `'ANSI Shadow'`.
 * @param {number} width Wrap the art at this many columns.
 */
function renderAsciiArt(text, font, width) {
	const art = figlet.textSync(text, { font, width, whitespaceBreak: true }).trimEnd();
	return art.trim() ? art : text;
}

/**
 * Prints the bot's name as ASCII art, followed by a short summary.
 *
 * @param {import('../client').BotClient} client
 * @param {NodeJS.WritableStream & { columns?: number }} [stream]
 */
function printBanner(client, stream = process.stdout) {
	const colors = supportsColor(stream);
	const art = renderAsciiArt(client.user.username, client.config.banner.font, stream.columns ?? 100);

	const summary = [
		`${client.user.tag} is online! (template v${version})`,
		`Servers: ${client.guilds.cache.size} • Members: ${client.countMembers()} • Prefix: ${client.config.prefix}`,
		`Commands: ${client.slashCommands.size} slash, ${client.prefixCommands.size} prefix`,
	];

	stream.write(`\n${colorize(['bold', 'magenta'], art, colors)}\n\n${summary.join('\n')}\n\n`);
}

module.exports = { printBanner, renderAsciiArt };
