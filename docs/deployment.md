# Deployment

Once your bot works locally, you'll want it online all the time. Any machine or service that can run Node.js 24+
works: a VPS, a Raspberry Pi, or a hosting platform.

## Before you deploy

- Keep `.env` out of git. Set the variables in your host's dashboard or in a `.env` file on the server.
- Slash commands are registered every time the bot starts, so deploying new commands is just a restart.
- Use `npm ci --omit=dev` to install exactly the locked versions without development tools. It may print
  `husky: not found`: that's harmless, Husky is only used while developing.
- Run **one** copy of the bot per token. Two copies (say, one on your computer and one on a server) both answer every
  command.

## Docker

The repository includes a [`Dockerfile`](../Dockerfile) and a [`compose.yaml`](../compose.yaml).

```bash
# Build and start in the background (reads your .env file)
docker compose up -d --build

# Start the bot and a local MongoDB (set MONGODB_URI=mongodb://mongo:27017/discord-bot in .env)
docker compose --profile database up -d --build

# Follow the logs / stop the bot
docker compose logs -f bot
docker compose down
```

The image runs as an unprivileged user, restarts automatically (`restart: unless-stopped`) and shuts down gracefully
when stopped.

## PM2

[PM2](https://pm2.keymetrics.io/) keeps the bot running on a VPS and restarts it if it crashes:

```bash
npm install --global pm2
npm ci --omit=dev
pm2 start src/index.js --name discord-bot
pm2 save      # Remember the process list
pm2 startup   # Start PM2 when the machine boots (follow the printed instructions)
pm2 logs discord-bot
```

## Hosting platforms

Most platforms (Railway, Render, fly.io, Pterodactyl panels...) detect a Node.js project automatically:

- **Install command:** `npm ci --omit=dev`
- **Start command:** `npm start`
- **Environment variables:** add `DISCORD_TOKEN` and any optional ones from [Configuration](configuration.md).
- Run it as a **worker / background service**. The bot doesn't listen on an HTTP port, so web service health checks
  would fail.

## Logs

The bot writes all logs to standard output, in order, so Docker, PM2 and hosting dashboards capture everything.
Colours are turned off automatically when the output isn't a terminal. Set `NO_COLOR=1` to always disable them or
`FORCE_COLOR=1` to always enable them. Set `LOG_LEVEL=debug` to see more detail when investigating a problem.

## Releasing a new version

Merging `develop` into `main` publishes a release: a GitHub release with the notes from
[`CHANGELOG.md`](../CHANGELOG.md), and a Docker image on the GitHub Container Registry as
`ghcr.io/<owner>/<repository>`, tagged with the full version (`4.1.0`), the minor version (`4.1`), the major version
(`4`) and `latest`. [Branching and releases](branching-and-releases.md) explains the steps and the one-time setup.

To run a published image:

```bash
docker run -d --env-file .env --restart unless-stopped ghcr.io/<owner>/<repository>:4
```

Images are private by default for private repositories. Change the visibility under **Packages** on your GitHub
profile if you want others to pull it.

## Updating

```bash
git pull           # Or merge the upstream template into your fork
npm ci
npm test
```

Then restart the bot. The startup update check (`updateCheck` in `config.js`) tells you when a new release of the
template is available.
