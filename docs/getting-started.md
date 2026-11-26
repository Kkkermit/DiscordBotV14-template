# Getting started

This guide takes you from nothing to a running bot. It takes about ten minutes.

## Requirements

- [Node.js](https://nodejs.org/) **24 or newer**. Check with `node --version`. If you use
  [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in the project folder to switch to the version in `.nvmrc`.
- A code editor. [Visual Studio Code](https://code.visualstudio.com/) works well: it will suggest the ESLint and
  Prettier extensions when you open the project.
- A Discord account and a server where you can add bots (create a test server if you don't have one).

## 1. Create your Discord bot

1. Open the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
   Give it a name and accept the terms.
2. Open the **Bot** page in the sidebar.
3. Click **Reset Token**, then **Copy**. This is your bot token. Keep it secret: anyone who has it can control your
   bot. If it ever leaks, reset it here straight away.
4. Under **Privileged Gateway Intents**, enable **Message Content Intent** and click **Save Changes**. The bot needs it
   to read prefix commands such as `?ping`. The other privileged intents are not needed by the template.

## 2. Get the code and configure it

```bash
git clone https://github.com/Kkkermit/DiscordBotV14-template.git my-bot
cd my-bot
npm install
```

You can also click **Use this template** or **Fork** on GitHub to get your own copy of the repository first.

Now create your `.env` file. The easiest way is the interactive setup, which checks each answer for you:

```bash
npm run setup
```

Or copy `.env.example` to `.env` and fill it in yourself. Only `DISCORD_TOKEN` is required.

### Optional: your user ID

Put your Discord user ID in `DEVELOPER_IDS` to use commands marked `developerOnly`. To copy an ID, enable
**Developer Mode** in Discord (**User Settings → Advanced**), then right-click your name and choose **Copy User ID**.
The same works for servers and channels.

## 3. Invite the bot to your server

1. In the Developer Portal, open **OAuth2** and scroll to the **OAuth2 URL Generator**.
2. Under **Scopes**, select `bot` and `applications.commands`.
3. Under **Bot Permissions**, select **View Channels**, **Send Messages**, **Send Messages in Threads**,
   **Embed Links** and **Read Message History**. That's all the bundled commands need. Add more only when your own
   features need them; avoid **Administrator**.
4. Open the generated URL, pick your server and click **Authorize**.

Alternatively, replace `YOUR_CLIENT_ID` (the **Application ID** on the **General Information** page) in this link:

```text
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot+applications.commands&permissions=274877991936
```

## 4. Start the bot

```bash
npm start
```

You should see the commands and events load, followed by `Logged in as YourBot#0000` and the startup banner. Try
`/help` and `?help` in your server.

While developing, use `npm run dev` instead. It restarts the bot every time you save a file.

If something goes wrong, the console tells you what to fix. The [troubleshooting guide](troubleshooting.md) covers the
most common problems.

## 5. Make it yours

- Change the prefix, colours, status and messages in [`src/config.js`](../src/config.js).
- Pick another [figlet font](https://patorjk.com/software/taag) for the startup banner with `banner.font`, or set
  `banner.enabled: false`.
- If you keep the update check enabled, point `updateCheck.repository` to your own repository, or disable it.
- Write your first command: see [Writing commands](commands.md).
