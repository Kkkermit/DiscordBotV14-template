const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const { Collection } = require('discord.js');
const ready = require('../../src/events/client/ready');
const { createClient } = require('../helpers/fakes');

/** A client whose command registrations are recorded instead of sent to Discord. */
function createReadyClient(t) {
	const client = createClient();
	t.after(() => client.destroy());
	client.config = { ...client.config, banner: { enabled: false }, updateCheck: { enabled: false } };

	const registrations = [];
	client.application = /** @type {any} */ ({
		commands: {
			set: async (commands) => {
				registrations.push(commands);
				return new Collection(commands.map((command, index) => [`id-${index}`, command]));
			},
		},
	});
	return { client, registrations };
}

describe('ready', () => {
	it('registers every slash command globally', async (t) => {
		const { client, registrations } = createReadyClient(t);

		await ready.execute(client);
		assert.equal(registrations.length, 1);
		assert.deepEqual(
			registrations[0].map((command) => command.name).sort(),
			[...client.slashCommands.keys()].sort(),
		);
	});

	it("does not overwrite Discord's commands while a command file is broken", async (t) => {
		const { client, registrations } = createReadyClient(t);
		client.failedSlashCommandFiles = ['utility/broken.js'];

		await ready.execute(client);
		assert.equal(registrations.length, 0, 'registering would delete the broken command from Discord');
	});
});
