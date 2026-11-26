# Contributing

Thanks for helping improve the Discord Bot V14 Template! Bug reports, ideas, documentation fixes and code are all
welcome. Please follow the [code of conduct](CODE_OF_CONDUCT.md) in every interaction.

## Ways to help

- **Report a bug** or **suggest a feature** with the [issue templates](https://github.com/Kkkermit/DiscordBotV14-template/issues/new/choose).
  Search existing issues first, in case it has already been reported.
- **Improve the docs.** If something confused you, it probably confuses others too.
- **Fix an issue.** Issues labelled `good first issue` are a nice place to start. Comment on the issue so nobody else
  works on the same thing.
- **Ask questions** in the [Discord server](https://discord.gg/xcMVwAVjSD) rather than in issues.

For a large change, please open an issue to discuss it first. The template aims to stay small and beginner friendly,
so not every feature belongs in it.

## Development setup

You need Node.js 22.12 or newer.

```bash
git clone https://github.com/<your-username>/DiscordBotV14-template.git
cd DiscordBotV14-template
npm install
npm run setup   # Create a .env file for your own test bot
npm run dev     # Start the bot and restart it when you save
```

Use a separate test bot and server for development, so you can try changes without affecting your real bot.

`npm install` also sets up a pre-commit hook. Every time you commit, it runs ESLint (fixing what it can) and Prettier
on the files you changed, so you never have to think about formatting. If ESLint finds a problem it can't fix, the
commit stops and shows you where it is.

## Before opening a pull request

```bash
npm run check   # ESLint, Prettier check and the tests. CI runs the same checks.
```

- `npm run lint:fix` and `npm run format` fix most style problems automatically. With the recommended VS Code
  extensions, files are formatted when you save.
- Add or update tests for behaviour you change. Put them at the same path as the code, e.g. `test/lib/format.test.js`
  for `src/lib/format.js`. [`test/helpers/fakes.js`](test/helpers/fakes.js) has fake messages and interactions so
  commands can be tested without Discord. `npm run test:coverage` shows which lines are still untested.
- Update the docs (`README.md`, `docs/`, `.env.example`) when you change setup steps, configuration or commands.
- Add a line to the `Unreleased` section of [`CHANGELOG.md`](CHANGELOG.md).
- Never commit tokens, `.env` files or other secrets.

## Code style

- CommonJS modules (`require` / `module.exports`), formatted by Prettier (tabs, single quotes, 120 columns).
- Prefer clear names and small functions over comments. When you do comment, explain why rather than what.
- Document exported functions with JSDoc, including types, so editors can show IntelliSense.
- Use the scoped logger (`logger.child('Feature')`) instead of `console.log`.
- Use the discord.js `Events`, `PermissionFlagsBits` and `MessageFlags` enums instead of strings and numbers.
- User-facing errors should be friendly and never include stack traces or internal details.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `type: short description`, for example
`fix: handle commands used in DMs` or `docs: explain gateway intents`. Common types are `feat`, `fix`, `docs`,
`refactor`, `test`, `ci`, `build` and `chore`. Add `!` after the type for breaking changes (`feat!: ...`).

## Pull requests

1. Fork the repository and create a branch from `main`, named after the change (e.g. `fix/help-autocomplete`).
2. Make your changes in focused commits.
3. Run `npm run check`.
4. Open a pull request and fill in the template. Link the issue it fixes, e.g. `Closes #12`.

A maintainer will review it as soon as possible. Thank you for contributing!
