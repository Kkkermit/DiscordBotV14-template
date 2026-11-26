const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const {
	ApplicationCommandType,
	Collection,
	ComponentType,
	ContextMenuCommandBuilder,
	SlashCommandBuilder,
	embedLength,
} = require('discord.js');
const { loadPrefixCommands, loadSlashCommands } = require('../../src/handlers/commandHandler');
const {
	DEVELOPER_ID,
	GUILD_ID,
	USER_ID,
	createClient,
	createInteraction,
	createMessage,
	createUser,
} = require('../helpers/fakes');

// These tests cover the commands that come with the template.
// If you delete one of those commands, its tests are skipped instead of failing.
const slashNames = new Set(loadSlashCommands().commands.keys());
const prefixNames = new Set(loadPrefixCommands().commands.keys());
const needsSlash = (...names) => {
	const missing = names.find((name) => !slashNames.has(name));
	return { skip: missing ? `/${missing} was removed` : false };
};
const needsPrefix = (...names) => {
	const missing = names.find((name) => !prefixNames.has(name));
	return { skip: missing ? `${missing} was removed` : false };
};

const embedOf = (payload) => payload.embeds[0].data;

describe('slash commands', () => {
	it('/ping reports the latency', needsSlash('ping'), async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const interaction = createInteraction('ping');

		await client.slashCommands.get('ping').execute(interaction, client);
		assert.equal(embedOf(interaction.edits[0]).title, '🏓 Pong!');
	});

	it('/uptime shows the uptime', needsSlash('uptime'), async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const interaction = createInteraction('uptime');

		await client.slashCommands.get('uptime').execute(interaction, client);
		assert.equal(embedOf(interaction.replies[0]).fields[0].value, '`1m 30s`');
	});

	it('/help lists every category and shows command details', needsSlash('help'), async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const help = client.slashCommands.get('help');

		const list = createInteraction('help');
		await help.execute(list, client);
		const categories = [...new Set(client.slashCommands.map((command) => command.category))].sort();
		assert.deepEqual(
			embedOf(list.replies[0]).fields.map(({ name }) => name),
			categories,
		);

		const detail = createInteraction('help', { options: { command: 'help' } });
		await help.execute(detail, client);
		assert.equal(embedOf(detail.replies[0]).title, 'Command: help');

		const missing = createInteraction('help', { options: { command: 'nope' } });
		await help.execute(missing, client);
		assert.match(missing.replies[0].content, /no command called `nope`/);

		// Discord rejects messages over 2000 characters, so a long name must be shortened.
		const long = createInteraction('help', { options: { command: 'x'.repeat(3000) } });
		await help.execute(long, client);
		assert.ok(long.replies[0].content.length < 2000);
	});

	it('/help hides developer-only commands from other users', needsSlash('help'), async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		client.slashCommands.set('secret', {
			data: new SlashCommandBuilder().setName('secret').setDescription('Developers only.'),
			developerOnly: true,
			execute: async () => {},
			category: 'Admin',
			filePath: 'admin/secret.js',
		});
		const suggestionsFor = async (userId) => {
			const interaction = createInteraction('help', { userId, focused: 'e' });
			await client.slashCommands.get('help').autocomplete(interaction, client);
			return interaction.responses[0].map(({ name }) => name);
		};

		const forUser = await suggestionsFor(USER_ID);
		const forDeveloper = await suggestionsFor(DEVELOPER_ID);
		assert.ok(
			forUser.every((name) => name.includes('e')),
			'suggestions should match what was typed',
		);
		assert.ok(!forUser.includes('secret'));
		assert.ok(forDeveloper.includes('secret'));
	});

	it('/help stays within Discord embed limits with many commands', needsSlash('help'), async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		for (let i = 0; i < 200; i += 1) {
			const name = `command-${i}`;
			client.slashCommands.set(name, {
				data: new SlashCommandBuilder().setName(name).setDescription('A'.repeat(100)),
				execute: async () => {},
				category: `Category ${i % 12}`,
				filePath: `${name}.js`,
			});
		}

		const interaction = createInteraction('help');
		await client.slashCommands.get('help').execute(interaction, client);
		const embed = embedOf(interaction.replies[0]);
		assert.ok(embedLength(embed) <= 6000, `embed is ${embedLength(embed)} characters`);
		assert.ok(embed.fields.every((field) => field.value.length <= 1024));
		assert.ok(embed.fields.some((field) => /…and \d+ more$/.test(field.value)));
	});

	it('/help finds context menu commands regardless of case', needsSlash('help'), async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		client.slashCommands.set('Avatar', {
			data: new ContextMenuCommandBuilder().setName('Avatar').setType(ApplicationCommandType.User),
			execute: async () => {},
			category: 'Info',
			filePath: 'info/avatar.js',
		});
		const help = client.slashCommands.get('help');

		const typing = createInteraction('help', { focused: 'av' });
		await help.autocomplete(typing, client);
		assert.deepEqual(typing.responses[0], [{ name: 'Avatar', value: 'Avatar' }]);

		const detail = createInteraction('help', { options: { command: 'Avatar' } });
		await help.execute(detail, client);
		assert.equal(embedOf(detail.replies[0]).title, 'Command: Avatar');
		assert.match(embedOf(detail.replies[0]).fields[0].value, /right-click menu/);
	});

	it('/bot-info can only be refreshed by the user who ran it', needsSlash('bot-info'), async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const interaction = createInteraction('bot-info');

		await client.slashCommands.get('bot-info').execute(interaction, client);
		assert.equal(embedOf(interaction.replies[0]).author.name, 'TemplateBot information');

		const { collector } = interaction.sentMessage;
		const replies = [];
		const updates = [];
		const click = (userId) => ({
			customId: 'bot-info:refresh',
			user: { id: userId },
			reply: async (payload) => replies.push(payload),
			update: async (payload) => updates.push(payload),
		});

		collector.emit('collect', click('someone-else'));
		collector.emit('collect', click(USER_ID));
		collector.emit('end');
		await new Promise(setImmediate);

		assert.equal(replies.length, 1);
		assert.equal(updates.length, 1);
		const [row] = interaction.edits[0].components;
		assert.equal(row.components[0].data.type, ComponentType.Button);
		assert.equal(row.components[0].data.disabled, true);
	});

	it('/user-info shows server details for members', needsSlash('user-info'), async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const role = (id, position) => ({ id, position, toString: () => `<@&${id}>` });
		const roles = new Collection([[GUILD_ID, role(GUILD_ID, 0)]]); // The @everyone role has the server's ID.
		for (let i = 1; i <= 20; i += 1) roles.set(`role-${i}`, role(`role-${i}`, i));

		const interaction = createInteraction('user-info');
		interaction.inCachedGuild = () => true;
		interaction.member = {
			id: interaction.user.id,
			displayColor: 0,
			nickname: 'Nick',
			joinedAt: new Date('2024-01-01T00:00:00Z'),
			roles: { cache: roles },
		};

		await client.slashCommands.get('user-info').execute(interaction, client);
		const fields = Object.fromEntries(
			embedOf(interaction.replies[0]).fields.map(({ name, value }) => [name, value]),
		);
		assert.equal(fields.Nickname, 'Nick');
		assert.match(fields['Roles (20)'], /^<@&role-20> <@&role-19>/);
		assert.match(fields['Roles (20)'], /and 5 more$/);
		assert.ok(!fields['Roles (20)'].includes(GUILD_ID), '@everyone should not be listed');
	});

	it('/user-info describes the requested user', needsSlash('user-info'), async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const target = createUser('100000000000000009', 'someone');
		const interaction = createInteraction('user-info', { options: { user: target } });

		await client.slashCommands.get('user-info').execute(interaction, client);
		assert.equal(embedOf(interaction.replies[0]).author.name, 'someone');
		assert.deepEqual(interaction.replies[0].allowedMentions, { parse: [] });
	});
});

describe('prefix commands', () => {
	for (const name of ['ping', 'uptime', 'help', 'bot-info']) {
		it(`${name} replies`, needsPrefix(name), async (t) => {
			const client = createClient();
			t.after(() => client.destroy());
			const message = createMessage(`?${name}`);

			await client.prefixCommands.get(name).execute(message, client, []);
			assert.ok(message.replies.length > 0, 'no reply was sent');
		});
	}

	it('help says when a command does not exist, without echoing pings or code', needsPrefix('help'), async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const message = createMessage('?help x`<@1>`');

		await client.prefixCommands.get('help').execute(message, client, ['x`<@1>`']);
		assert.match(message.replies[0].content, /no command called `x<@1>`/);
		assert.deepEqual(message.replies[0].allowedMentions, { parse: [] });
	});

	it('help copes with long names and commands without a description', needsPrefix('help'), async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		client.prefixCommands.set('quiet', {
			name: 'quiet',
			description: '',
			execute: async () => {},
			category: 'Test',
			filePath: 'test/quiet.js',
		});
		const help = client.prefixCommands.get('help');

		const quiet = createMessage('?help quiet');
		await help.execute(quiet, client, ['quiet']);
		assert.equal(embedOf(quiet.replies[0]).description, 'No description.');

		const long = createMessage(`?help ${'x'.repeat(4000)}`);
		await help.execute(long, client, ['x'.repeat(4000)]);
		assert.ok(long.replies[0].content.length < 2000);
	});

	it('help shows the details of a command by alias', needsPrefix('help', 'bot-info'), async (t) => {
		const client = createClient();
		t.after(() => client.destroy());
		const message = createMessage('?help bi');

		await client.prefixCommands.get('help').execute(message, client, ['bi']);
		const embed = embedOf(message.replies[0]);
		assert.equal(embed.title, 'Command: bot-info');
		assert.ok(embed.fields.some(({ name, value }) => name === 'Aliases' && value.includes('`bi`')));
	});
});
