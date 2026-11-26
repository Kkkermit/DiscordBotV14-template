---
name: release
description: Release a new version of this template from start to finish - set the version, merge it through develop into main, and confirm the GitHub release, Docker image and docs site. Use when the user asks to release, ship or publish a new version, e.g. "release a minor version".
---

# Release a new version

A release is a merge of `develop` into `main`; GitHub Actions then publishes the GitHub release, the Docker image and
the docs site. [`docs/branching-and-releases.md`](../../../docs/branching-and-releases.md) explains the flow.

The user asking for a release is their approval to merge the two pull requests below, and nothing else. Never push to
`main` or `develop` directly, force-push, or create, move or delete tags.

## 1. Check that `develop` is ready

Run `git fetch origin`, then on `origin/develop`:

- `CHANGELOG.md` must have notes under `## Unreleased`. If it's empty there's nothing to release: tell the user and stop.
- The latest CI run on `develop` must have passed.

Use the release type the user asked for. If they didn't say: `patch` when the notes only fix things, `minor` when they
add or change something, and `major` only for breaking changes, after asking the user.

## 2. Prepare the release on a `release/` branch

```bash
git switch --detach origin/develop
npm ci                               # only if node_modules is missing
npm run prepare-release <type>       # prints "Prepared version <version>"
git switch -c release/<version>
git commit -am "chore: release <version>"
git push -u origin release/<version>
```

Open a pull request from `release/<version>` into `develop`, titled `chore: release <version>`.

## 3. Merge it into `develop`

Wait for its checks without polling (subscribe to the pull request's activity). Once **Source branch**, **Lint and
format**, both **Test** jobs and **Docker image** pass, squash-merge it and delete the branch.

## 4. Merge `develop` into `main`

Open a pull request from `develop` into `main`, titled `Release <version>`, with the output of
`node scripts/release-notes.js <version>` as its description. Wait for its checks, including **Release version**.

Merge it with a **merge commit**. Never squash or rebase it (`main` and `develop` would drift apart), and never delete
`develop`.

## 5. Confirm it published

- The **Release** workflow run on `main` passed, and the GitHub release `v<version>` exists with the changelog notes.
- Its **Docker image** job passed.
- If `website/` changed since the last release, the **Docs** workflow published the site. If it failed because GitHub
  Pages isn't enabled, ask the user to set **Settings → Pages → Source** to **GitHub Actions**, then re-run it.

Give the user the link to the release.

## If something fails

- A check fails on a pull request: find the cause and push a fix to that branch. Never skip or disable a test.
- **Release version** fails: that version is already released. Start again from step 2 with a new version.
- `prepare-release` says nothing is listed under `## Unreleased`: the changes haven't been merged into `develop` yet.
