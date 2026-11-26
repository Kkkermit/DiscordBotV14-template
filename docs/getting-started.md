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

Now create your `.env` file. The setup asks for your bot token, and optionally your Discord user ID (which lets you
use commands marked `developerOnly`). To copy your user ID, enable **Developer Mode** in Discord (**User Settings →
Advanced**), then right-click your name and choose **Copy User ID**.

```bash
npm run setup
```

The setup checks each answer for you. You can also copy `.env.example` to `.env` and fill it in yourself. Only
`DISCORD_TOKEN` is required.

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

While developing, use `npm run dev` instead. It restarts the bot whenever you change or add a file in `src/`.

If something goes wrong, the console tells you what to fix. The [troubleshooting guide](troubleshooting.md) covers the
most common problems.

## 5. Make it yours

- In [`src/config.js`](../src/config.js), set `developerName` to your name (it's shown in every embed footer), and
  change the prefix, colours, status and messages.
- Pick another [figlet font](https://patorjk.com/software/taag) for the startup banner with `banner.font`, or set
  `banner.enabled: false`.
- In `package.json`, change `name`, `description` and `author` to your bot's. `version` is your bot's version from now
  on; the startup banner shows it.
- The update check tells you when a new version of this template is released. Once you change `version` or release
  your own bot, set `updateCheck.enabled: false` in `config.js`.
- Write your first command: see [Writing commands](commands.md).
