/**
 * Returns every prefix that can start a command: the configured prefix and, if enabled,
 * the bot's mention (`<@id>` and the legacy `<@!id>` form).
 *
 * @param {import('../client').BotClient} client
 * @returns {string[]} Longest first, so a longer prefix is never shadowed by a shorter one.
 */
function getPrefixes(client) {
	const prefixes = [client.config.prefix];
	if (client.config.commands.mentionAsPrefix && client.user) {
		prefixes.push(`<@${client.user.id}>`, `<@!${client.user.id}>`);
	}
	return prefixes.sort((a, b) => b.length - a.length);
}

/**
 * Splits a message into the prefix, command name and arguments.
 * Prefix matching is case-insensitive and the returned name is lower case.
 *
 * @example parsePrefixCommand('?Say hello world', ['?']) // { prefix: '?', name: 'say', args: ['hello', 'world'] }
 * @param {string} content
 * @param {string[]} prefixes
 * @returns {{ prefix: string, name: string, args: string[] } | null} `null` when the message is not a command.
 */
function parsePrefixCommand(content, prefixes) {
	const lowered = content.toLowerCase();
	const prefix = prefixes.find((candidate) => lowered.startsWith(candidate.toLowerCase()));
	if (!prefix) return null;

	const [name = '', ...args] = content.slice(prefix.length).trim().split(/\s+/);
	if (!name) return null;

	return { prefix, name: name.toLowerCase(), args };
}

module.exports = { getPrefixes, parsePrefixCommand };
