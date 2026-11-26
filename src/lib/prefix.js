function getPrefixes(client) {
	const prefixes = [client.config.prefix];
	if (client.config.commands.mentionAsPrefix && client.user) {
		// <@!id> is an older mention format that some apps still send.
		prefixes.push(`<@${client.user.id}>`, `<@!${client.user.id}>`);
	}
	// Longest first, so a long prefix isn't mistaken for a shorter one.
	return prefixes.sort((a, b) => b.length - a.length);
}

function parsePrefixCommand(content, prefixes) {
	const lowered = content.toLowerCase();
	const prefix = prefixes.find((candidate) => lowered.startsWith(candidate.toLowerCase()));
	if (!prefix) return null;

	const [name = '', ...args] = content.slice(prefix.length).trim().split(/\s+/);
	if (!name) return null;

	return { prefix, name: name.toLowerCase(), args };
}

module.exports = { getPrefixes, parsePrefixCommand };
