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

You need Node.js 24 or newer.

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
- Update the docs (`README.md`, `docs/`, `.env.example`, `AGENTS.md`) when you change setup steps, configuration,
  commands or files.
- Add a line to the `Unreleased` section of [`CHANGELOG.md`](CHANGELOG.md).
- Never commit tokens, `.env` files or other secrets.

## Getting credit

Everyone who helps is listed in the README's [Contributors](README.md#contributors) section, whatever they did: code,
docs, bug reports, ideas, reviews or answering questions. When your contribution is merged, a maintainer comments:

```text
@all-contributors please add @your-username for code, doc
```

The [All Contributors](https://allcontributors.org) bot then opens a pull request that adds you. Common types are
`code`, `doc`, `bug`, `ideas`, `review`, `test`, `question` and `translation`; the
[emoji key](https://allcontributors.org/en/reference/emoji-key/) lists them all. If you were missed, ask on your pull
request.

## Working on the documentation site

The [documentation site](https://kkkermit.github.io/DiscordBotV14-template/) lives in `website/` and has its own
packages. Run `cd website && npm install && npm run dev` to preview it while you edit. [`website/README.md`](website/README.md)
explains how the pages work.

## Code style

- CommonJS modules (`require` / `module.exports`), formatted by Prettier (tabs, single quotes, 120 columns).
- Prefer clear names and small functions over comments. Add a short comment only when the code needs a reason (why,
  not what), and don't use JSDoc.
- Use the scoped logger (`logger.child('Feature')`) instead of `console.log`.
- Use the discord.js `Events`, `PermissionFlagsBits` and `MessageFlags` enums instead of strings and numbers.
- User-facing errors should be friendly and never include stack traces or internal details.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/): `type: short description`, for example
`fix: handle commands used in DMs` or `docs: explain gateway intents`. Common types are `feat`, `fix`, `docs`,
`refactor`, `test`, `ci`, `build` and `chore`. Add `!` after the type for breaking changes (`feat!: ...`).

## Pull requests

New work goes into the `develop` branch, and `develop` is merged into `main` for each release (see
[Branching and releases](docs/branching-and-releases.md)).

1. Fork the repository and create a branch from `develop`. Start its name with `feature/` for a new feature or
   `bugfix/` for a fix, e.g. `bugfix/help-autocomplete`. Other names fail the **Source branch** check.
2. Make your changes in focused commits.
3. Run `npm run check`.
4. Open a pull request **into `develop`** and fill in the template. Link the issue it fixes, e.g. `Closes #12`.

A maintainer will review it as soon as possible. Thank you for contributing!
