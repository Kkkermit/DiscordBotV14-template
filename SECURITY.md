# Security policy

## Supported versions

Security fixes are made for the latest release only. Please make sure you can reproduce an issue on the latest
version of the `main` branch before reporting it.

## Reporting a vulnerability

**Please don't report security problems in public issues or on Discord.**

Report them privately through GitHub instead: open the repository's **Security** tab and click
**[Report a vulnerability](https://github.com/Kkkermit/DiscordBotV14-template/security/advisories/new)**. Include:

- what the problem is and what an attacker could do with it,
- the steps or code needed to reproduce it,
- the version or commit you tested.

You should get a reply within a week. Once the problem is confirmed, a fix is prepared and released, and you are
credited in the release notes unless you prefer otherwise.

## Keeping your own bot safe

- Never share or commit your bot token or `.env` file. If a token leaks, reset it immediately in the
  [Developer Portal](https://discord.com/developers/applications) (**Bot → Reset Token**). GitHub also detects
  committed Discord tokens and Discord resets them automatically.
- Give the bot only the permissions it needs. Avoid **Administrator**.
- Restrict MongoDB network access to your bot's IP address and use a strong database password.
- Pass `allowedMentions: { parse: [] }` when the bot repeats user input, so it can't be made to mass-ping.
- Keep dependencies up to date. Dependabot opens pull requests for updates automatically.
