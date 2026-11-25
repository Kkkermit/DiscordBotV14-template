'use strict';

const { version } = require('../../package.json');
const { ANSI, supportsColor } = require('./logger');

const ART = [
	'██████╗ ███████╗██╗   ██╗    ██████╗ ██╗   ██╗    ██╗  ██╗██╗  ██╗███████╗██████╗ ███╗   ███╗██╗████████╗',
	'██╔══██╗██╔════╝██║   ██║    ██╔══██╗╚██╗ ██╔╝    ██║ ██╔╝██║ ██╔╝██╔════╝██╔══██╗████╗ ████║██║╚══██╔══╝',
	'██║  ██║█████╗  ██║   ██║    ██████╔╝ ╚████╔╝     █████╔╝ █████╔╝ █████╗  ██████╔╝██╔████╔██║██║   ██║   ',
	'██║  ██║██╔══╝  ╚██╗ ██╔╝    ██╔══██╗  ╚██╔╝      ██╔═██╗ ██╔═██╗ ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║   ',
	'██████╔╝███████╗ ╚████╔╝     ██████╔╝   ██║       ██║  ██╗██║  ██╗███████╗██║  ██║██║ ╚═╝ ██║██║   ██║   ',
	'╚═════╝ ╚══════╝  ╚═══╝      ╚═════╝    ╚═╝       ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝   ╚═╝   ',
];

/**
 * Prints the ASCII art banner and a short summary of the bot. Replace `ART` with your own!
 *
 * @param {import('../client').BotClient} client
 * @param {NodeJS.WritableStream} [stream]
 */
function printBanner(client, stream = process.stdout) {
	const colors = supportsColor(stream);
	const paint = (text) => (colors ? `${ANSI.pink}${text}${ANSI.reset}` : text);
	const divider = '='.repeat(ART[0].length);

	const lines = [
		divider,
		...ART,
		divider,
		`${client.user.tag} is online! (template v${version})`,
		`Serving ${client.guilds.cache.size} server(s) and ${client.countMembers()} member(s).`,
		`${client.slashCommands.size} slash command(s) and ${client.prefixCommands.size} prefix command(s) loaded.`,
		`Prefix: ${client.config.prefix}`,
		divider,
	];

	stream.write(`${lines.map(paint).join('\n')}\n`);
}

module.exports = { printBanner };
