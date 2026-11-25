# Writing commands

The template supports two kinds of commands:

- **Slash commands** (`/ping`) in `src/commands/slash/<Category>/`. Discord shows them in the command picker with
  their options, so they are the recommended way for users to interact with your bot.
- **Prefix commands** (`?ping`) in `src/commands/prefix/<Category>/`. Classic text commands, read from messages.

Every `.js` file inside a category folder is loaded automatically when the bot starts. The folder name becomes the
command's category in `/help`. Files and folders starting with `_` are skipped, so you can keep shared helpers such as
`_utils.js` next to your commands.

If a command file has a mistake, the bot logs which file and why, skips it, and starts anyway.

## Slash commands

```js
// src/commands/slash/Fun/roll.js
'use strict';

const { SlashCommandBuilder } = require('discord.js');

/** @type {import('../../../types').SlashCommand} */
module.exports = {
  data: new SlashCommandBuilder()
    .setName('roll')
    .setDescription('Roll a dice.')
    .addIntegerOption((option) =>
      option.setName('sides').setDescription('How many sides the dice has.').setMinValue(2).setMaxValue(100),
    ),

  cooldown: 5,

  async execute(interaction, client) {
    const sides = interaction.options.getInteger('sides') ?? 6;
    const result = Math.floor(Math.random() * sides) + 1;
    await interaction.reply(`🎲 You rolled a **${result}** (1-${sides}).`);
  },
};
```

The `/** @type ... */` comment is optional, but it gives you autocompletion for `interaction` and `client` in your
editor.

### Properties

| Property        | Required | Description                                                                                                       |
| --------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `data`          | Yes      | A `SlashCommandBuilder` (or `ContextMenuCommandBuilder`). Slash command names must be lower case, without spaces. |
| `execute`       | Yes      | `async (interaction, client) => {}`. Runs when the command is used.                                               |
| `autocomplete`  | No       | `async (interaction, client) => {}`. Runs while the user types an option with autocomplete.                       |
| `cooldown`      | No       | Seconds between uses, per user. Defaults to `commands.defaultCooldownSeconds` in `config.js`.                     |
| `developerOnly` | No       | `true` to only allow users in `DEVELOPER_IDS`.                                                                    |

### Registering slash commands

Discord needs to know about your slash commands before they appear. By default the bot registers them every time it
starts (`commands.registerOnStartup` in `config.js`), so adding a file and restarting is enough.

- With `DISCORD_GUILD_ID` set, commands are registered in that server only and update **instantly**.
- Without it, commands are registered **globally** and can take up to an hour to show up everywhere.

You can also register them without starting the bot:

```bash
npm run deploy                # Same scope as the bot: your test server if DISCORD_GUILD_ID is set, otherwise global
npm run deploy -- --global    # Register globally even if DISCORD_GUILD_ID is set
npm run deploy -- --clear     # Remove all commands from the scope (add --global to clear global commands)
```

> [!TIP]
> Seeing every command twice? You registered them both globally and in your test server. Run
> `npm run deploy -- --global --clear` to remove the global copies while developing.

### Replies

Every interaction must be answered within 3 seconds:

```js
await interaction.reply('Hello!');

// Only the user who ran the command can see it:
const { MessageFlags } = require('discord.js');
await interaction.reply({ content: 'Only you can see this.', flags: MessageFlags.Ephemeral });

// Need more than 3 seconds? Defer first, then edit the reply when you're done:
await interaction.deferReply();
const data = await somethingSlow();
await interaction.editReply(`Done: ${data}`);
```

If your command throws an error, the template logs it with the file name and shows the user the `messages.error`
text from `config.js`. It works whether or not you already replied, so you don't need a `try/catch` around everything.

### Options

```js
new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Warn a member.')
  .addUserOption((option) => option.setName('member').setDescription('Who to warn.').setRequired(true))
  .addStringOption((option) => option.setName('reason').setDescription('Why.').setMaxLength(200));

// In execute:
const member = interaction.options.getMember('member');
const reason = interaction.options.getString('reason') ?? 'No reason given';
```

Required options must come before optional ones. See the
[discord.js guide on options](https://discordjs.guide/slash-commands/advanced-creation.html) for every option type,
choices and subcommands.

### Permissions

Use `setDefaultMemberPermissions` to hide a command from members without a permission. Server admins can change this
per server in **Server Settings → Integrations**.

```js
const { InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');

new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Delete messages.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .setContexts(InteractionContextType.Guild); // Only usable in servers, not in DMs
```

`developerOnly: true` hides the command from `/help` and blocks everyone not in `DEVELOPER_IDS`, but Discord still
shows it in the command picker. For private admin tools, also use `.setDefaultMemberPermissions(0)` so only server
administrators see it, and register it in your own server only.

### Autocomplete

Add `.setAutocomplete(true)` to a string, integer or number option and export an `autocomplete` function. The
bundled [`/help`](../src/commands/slash/Utility/help.js) command is a complete example.

```js
const FRUITS = ['apple', 'banana', 'cherry'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fruit')
    .setDescription('Pick a fruit.')
    .addStringOption((option) =>
      option.setName('name').setDescription('The fruit.').setAutocomplete(true).setRequired(true),
    ),

  async autocomplete(interaction) {
    const typed = interaction.options.getFocused().toLowerCase();
    const choices = FRUITS.filter((fruit) => fruit.startsWith(typed)).slice(0, 25); // Discord allows 25
    await interaction.respond(choices.map((fruit) => ({ name: fruit, value: fruit })));
  },

  async execute(interaction) {
    await interaction.reply(`You picked ${interaction.options.getString('name')}.`);
  },
};
```

### Buttons and select menus

For components that belong to one command, create a collector on the reply. The bundled
[`bot-info`](../src/lib/botInfo.js) refresh button shows the full pattern, including disabling the button afterwards.

```js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

async execute(interaction) {
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder().setCustomId('confirm').setLabel('Confirm').setStyle(ButtonStyle.Success),
	);
	const response = await interaction.reply({ content: 'Are you sure?', components: [row], withResponse: true });

	const collector = response.resource.message.createMessageComponentCollector({
		componentType: ComponentType.Button,
		filter: (button) => button.user.id === interaction.user.id,
		time: 30_000,
	});

	collector.on('collect', async (button) => {
		await button.update({ content: 'Confirmed!', components: [] });
	});
}
```

### Context menu commands

Context menu commands appear when right-clicking a user or a message. Put them in the slash folder with a
`ContextMenuCommandBuilder`:

```js
const { ApplicationCommandType, ContextMenuCommandBuilder, MessageFlags } = require('discord.js');

/** @type {import('../../../types').SlashCommand} */
module.exports = {
  data: new ContextMenuCommandBuilder().setName('Avatar').setType(ApplicationCommandType.User),

  async execute(interaction) {
    await interaction.reply({
      content: interaction.targetUser.displayAvatarURL({ size: 1024 }),
      flags: MessageFlags.Ephemeral,
    });
  },
};
```

## Prefix commands

```js
// src/commands/prefix/Fun/say.js
'use strict';

const { PermissionFlagsBits } = require('discord.js');

/** @type {import('../../../types').PrefixCommand} */
module.exports = {
  name: 'say',
  description: 'Make the bot say something.',
  aliases: ['echo'],
  usage: '<text>',
  args: true,
  permissions: [PermissionFlagsBits.ManageMessages],
  cooldown: 10,

  async execute(message, client, args) {
    await message.channel.send({ content: args.join(' '), allowedMentions: { parse: [] } });
  },
};
```

`?say hello world` runs this command with `args` set to `['hello', 'world']`. So does `@YourBot say hello world`.

### Properties

| Property        | Required | Description                                                                             |
| --------------- | -------- | --------------------------------------------------------------------------------------- |
| `name`          | Yes      | The word after the prefix, in lower case without spaces. Users can type it in any case. |
| `execute`       | Yes      | `async (message, client, args) => {}`. `args` are the words after the command name.     |
| `description`   | No       | Shown in `?help`.                                                                       |
| `aliases`       | No       | Other names for the command, in lower case, e.g. `['p']`.                               |
| `usage`         | No       | Shown in `?help <command>` and when arguments are missing, e.g. `'<user> [reason]'`.    |
| `args`          | No       | `true` to require at least one argument. The usage is shown when none are given.        |
| `permissions`   | No       | Permissions the member needs, e.g. `[PermissionFlagsBits.KickMembers]`.                 |
| `cooldown`      | No       | Seconds between uses, per user. Defaults to `commands.defaultCooldownSeconds`.          |
| `developerOnly` | No       | `true` to only allow users in `DEVELOPER_IDS`.                                          |

Prefix commands only run in servers, not in DMs. If two commands use the same alias, the first one keeps it and a
warning is logged; a command's name always wins over another command's alias.

> [!IMPORTANT]
> When repeating user input, pass `allowedMentions: { parse: [] }` like the example above so nobody can make the bot
> ping `@everyone` or a role. The client already blocks `@everyone`, `@here` and role pings by default.

## Sharing code between slash and prefix commands

If a command exists in both forms, move the shared logic into a helper and call it from both files. The bundled
`bot-info` commands do this with [`src/lib/botInfo.js`](../src/lib/botInfo.js). Helpers inside a command folder must
start with `_` (e.g. `src/commands/slash/Fun/_jokes.js`) so they aren't loaded as commands.

## Useful helpers

| Helper                                 | From                 | Use it to                                           |
| -------------------------------------- | -------------------- | --------------------------------------------------- |
| `createEmbed(client)`                  | `src/lib/embeds.js`  | Start an embed with your colour and footer.         |
| `createNoticeEmbed(text, color?)`      | `src/lib/embeds.js`  | Build a short error or notice embed.                |
| `replyEphemeral(interaction, options)` | `src/lib/replies.js` | Reply privately, even if you already replied.       |
| `formatDuration(ms)`                   | `src/lib/format.js`  | Turn milliseconds into `1d 2h 3m 4s`.               |
| `logger.child('MyFeature')`            | `src/lib/logger.js`  | Log with a label: `log.info('Something happened')`. |
| `client.isDeveloper(userId)`           | `src/client.js`      | Check if a user is in `DEVELOPER_IDS`.              |
| `client.getPrefixCommand(nameOrAlias)` | `src/client.js`      | Look up a prefix command.                           |
