# Troubleshooting

The bot explains most problems in the console when it starts. If yours isn't listed here, run it with
`LOG_LEVEL=debug` for more detail, then ask in the [support server](https://discord.gg/xcMVwAVjSD) or
[open an issue](https://github.com/Kkkermit/DiscordBotV14-template/issues/new/choose).

### "DISCORD_TOKEN is required"

The bot couldn't find your token. Make sure the file is called exactly `.env` (not `.env.txt` or `example.env`), that
it's in the project root next to `package.json`, and that the line reads `DISCORD_TOKEN=your-token` with no spaces
around `=`. Run `npm run setup` to create it for you.

### "Discord rejected the token" / "An invalid token was provided"

The token is wrong or was reset. Open **Developer Portal → Bot → Reset Token**, copy the new token and update
`DISCORD_TOKEN`. Copy the bot token, not the client secret from the OAuth2 page.

### "Used disallowed intents"

The bot asks for a privileged intent that isn't enabled. Open **Developer Portal → Bot → Privileged Gateway Intents**
and enable **Message Content Intent** (and any other privileged intent you added in `src/client.js`).

### Slash commands don't show up

- Without `DISCORD_GUILD_ID`, commands are global and can take up to an hour to appear. Set `DISCORD_GUILD_ID` while
  developing for instant updates.
- The bot must be invited with the `applications.commands` scope. Re-invite it with the link from
  [Getting started](getting-started.md#3-invite-the-bot-to-your-server).
- Check the console for `Skipped slash command ...` errors: a broken command file isn't registered.
- Press `Ctrl+R` in the Discord desktop app to refresh its command cache.

### Every slash command appears twice

They're registered both globally and in your test server. While developing, remove the global copies with
`npm run deploy -- --global --clear`. In production, remove the server copies with `npm run deploy -- --clear`
(with `DISCORD_GUILD_ID` set to that server) and leave `DISCORD_GUILD_ID` empty.

### "Missing Access" when registering commands

The bot isn't in the server set as `DISCORD_GUILD_ID`, or that ID is wrong. Invite the bot or fix the ID.

### Prefix commands don't respond

- Enable **Message Content Intent** in the Developer Portal. Without it, the bot can't read messages.
- Check that you use the prefix from `src/config.js` (`?` by default). Mentioning the bot also works:
  `@YourBot ping`.
- The bot needs **View Channel**, **Send Messages** and **Read Message History** in that channel.
- Prefix commands don't run in DMs.

### "This command is no longer available"

Discord still lists a command that the bot no longer has, usually because you deleted or renamed the file. Restart
the bot (with `registerOnStartup` enabled) or run `npm run deploy` to update Discord's list.

### "Could not connect to MongoDB"

- Check the connection string, including the password. Special characters in the password must be
  [URL-encoded](https://www.mongodb.com/docs/manual/reference/connection-string/#std-label-connections-standard-connection-string-format)
  (for example `@` becomes `%40`).
- In MongoDB Atlas, add your machine's IP address under **Network Access**.
- Don't need a database? Remove `MONGODB_URI` from `.env`.

### `npm install` fails with "Unsupported engine"

Your Node.js version is too old. Install Node.js 22.12 or newer from [nodejs.org](https://nodejs.org/), or run
`nvm install` in the project folder if you use nvm.
