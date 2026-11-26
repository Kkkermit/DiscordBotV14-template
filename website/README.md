# Documentation website

The setup guide at **https://kkkermit.github.io/DiscordBotV14-template/**, built with
[Starlight](https://starlight.astro.build). The pages are MDX files in [`src/content/docs/`](src/content/docs), and the
sidebar is set in [`astro.config.mjs`](astro.config.mjs).

It's separate from the bot: it has its own `package.json`, and nothing here is needed to run the bot. Using the template
for your own bot? You can delete this folder and `.github/workflows/docs.yml`.

## Work on it

```bash
cd website
npm install
npm run dev       # http://localhost:4321/DiscordBotV14-template/, reloads when you save
npm run build     # Builds the site into dist/, like GitHub Actions does
npm run preview   # Serves the built site
```

## Writing pages

- Each `.mdx` file in `src/content/docs/` is a page. Its folder and name are its address:
  `setup/prerequisites.mdx` is `/setup/prerequisites/`. Add new pages to `sidebar` in `astro.config.mjs`.
- Every page starts with a `title` and a `description` (shown in search results).
- Use Starlight's components, such as `Steps`, `Tabs`, `Card` and `FileTree`
  ([list](https://starlight.astro.build/components/using-components/)), and asides: `:::tip`, `:::note`, `:::caution`,
  `:::danger`.
- Link to other pages with relative links that end in `/`, e.g. `[What you need](../prerequisites/)`. Links that start
  with `/` would miss the `/DiscordBotV14-template/` base.
- Indent with **2 spaces**, not tabs: Prettier misreads tabs inside components such as `<Tabs>`.
- The setup steps are also in [`docs/getting-started.md`](../docs/getting-started.md). Change both when setup changes.

## Publishing

[`.github/workflows/docs.yml`](../.github/workflows/docs.yml) builds the site on every pull request that changes it, and
publishes it to GitHub Pages when `main` changes, so the site always matches the latest release.

Turn GitHub Pages on once under **Settings → Pages → Source: GitHub Actions**. On a fork, change `SITE` and `BASE` in
`astro.config.mjs` to your own Pages address.
