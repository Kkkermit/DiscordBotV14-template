const figlet = require('figlet');
const { version } = require('../../package.json');
const { colorize, supportsColor } = require('./logger');

// figlet fonts only have basic Latin letters, so names in other scripts fall back to plain text.
function renderAsciiArt(text, font, width) {
	const art = figlet.textSync(text, { font, width, whitespaceBreak: true }).trimEnd();
	return art.trim() ? art : text;
}

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
