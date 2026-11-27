# Branching and releases

Changes reach users in two steps: work is merged into `develop`, and merging `develop` into `main` publishes a
release. Both branches are protected, so every change goes through a pull request with passing checks.

```text
feature/welcome-message ─┐
bugfix/help-typo ────────┼──► develop ──► main ──► GitHub release v4.1.0 + Docker image
release/4.1.0 ───────────┘
```

| Branch              | What it holds                                         | Created from | Merged into |
| ------------------- | ----------------------------------------------------- | ------------ | ----------- |
| `main`              | The released code. Every merge publishes a release.   |              |             |
| `develop`           | Everything that's ready for the next release.         | `main`, once | `main`      |
| `feature/<name>`    | A new feature, e.g. `feature/welcome-message`.        | `develop`    | `develop`   |
| `bugfix/<name>`     | A fix, e.g. `bugfix/help-typo`.                       | `develop`    | `develop`   |
| `release/<version>` | The version number and changelog of the next release. | `develop`    | `develop`   |

Branches made by the Dependabot and All Contributors bots (`dependabot/...`, `all-contributors/...`) go into
`develop` too. The
[Branch rules](../.github/workflows/branch-rules.yml) workflow checks these rules on every pull request.

## Making a change

```bash
git switch develop
git pull
git switch -c feature/welcome-message
```

Make your changes and add a line under `## Unreleased` in [`CHANGELOG.md`](../CHANGELOG.md) describing them. Then
push the branch and open a pull request into `develop`:

```bash
git push -u origin feature/welcome-message
```

The pull request needs these checks to pass: **Source branch**, **Lint and format**, **Test (Node.js 24.x)**,
**Test (Node.js 26.x)** and **Docker image**. Merge it with **Squash and merge** to turn it into one commit, or
**Create a merge commit** to keep every commit.

## Cutting a release

1. Choose the new version and update the files. Follow [semantic versioning](https://semver.org): `patch` for bug
   fixes only, `minor` for new features, `major` for changes that break existing bots.

   ```bash
   git switch develop
   git pull
   npm run prepare-release minor   # Prints the new version, e.g. 4.1.0
   ```

   This sets the version in `package.json` and `package-lock.json`, and moves the notes under `## Unreleased` in
   `CHANGELOG.md` to a new `## 4.1.0 - <date>` section. Read that section: it becomes the text of the release.

2. Commit it on a release branch and merge it into `develop` with a pull request:

   ```bash
   git switch -c release/4.1.0
   git commit -am "chore: release 4.1.0"
   git push -u origin release/4.1.0
   ```

3. Open a pull request from `develop` into `main`, titled e.g. "Release 4.1.0". The **Release version** check
   confirms the version hasn't been released yet and has notes in the changelog.

4. Merge it with **Create a merge commit**. That's the only merge method `main` allows: squashing would give `main`
   different commits from `develop`, and the next release pull request would conflict.

The [Release](../.github/workflows/release.yml) workflow then runs the checks again, creates the `v4.1.0` tag and a
GitHub release with the notes from the changelog, and publishes the Docker image as `ghcr.io/<owner>/<repository>`
with the tags `4.1.0`, `4.1`, `4` and `latest`. If that version already has a release, it publishes nothing.

### Let Claude Code do it

The repository includes a [release skill](../.claude/skills/release/SKILL.md) for
[Claude Code](https://claude.com/claude-code). Ask it to "release a minor version" (or patch, or major), from your
computer or from the Claude app on your phone. It does all four steps above: it prepares the release branch, opens the
pull requests, waits for their checks, merges them, and checks that the release, Docker image and docs site were
published.

## One-time setup

Do this once in your repository on GitHub. You need to be an admin of the repository.

### 1. Create the develop branch

```bash
git switch main
git pull
git switch -c develop
git push -u origin develop
```

Then make `develop` the default branch under **Settings → General → Default branch**. New pull requests then go to
`develop` without anyone having to pick it, including those from GitHub's web editor, Dependabot security updates and
the All Contributors bot. Releases still come only from `main`, and the release notes and Docker images are unchanged.

### 2. Choose the merge buttons

Under **Settings → General → Pull Requests**:

- **Allow merge commits:** on (needed for `develop` → `main`).
- **Allow squash merging:** on (for feature and bugfix branches).
- **Allow rebase merging:** off.
- **Automatically delete head branches:** on, to clean up merged feature branches. `develop` is never deleted,
  because its ruleset blocks deletion.

### 3. Import the rulesets

The [`.github/rulesets/`](../.github/rulesets) folder has three rulesets:

| File                | Protects  | Rules                                                                                                                                                          |
| ------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main.json`         | `main`    | No deleting or force pushing. Changes only through pull requests with merge commits, resolved conversations and passing checks, including **Release version**. |
| `develop.json`      | `develop` | The same, but squash merges are allowed too and **Release version** isn't required.                                                                            |
| `release-tags.json` | `v*` tags | Release tags can't be deleted or moved to another commit.                                                                                                      |

To import one, download the file, then go to **Settings → Rules → Rulesets → New ruleset → Import a ruleset**, choose
the file, check the settings and click **Create**. Repeat for each file.

Or, with the [GitHub CLI](https://cli.github.com/), run this from your clone:

```bash
gh api --method POST repos/{owner}/{repo}/rulesets --input .github/rulesets/main.json
gh api --method POST repos/{owner}/{repo}/rulesets --input .github/rulesets/develop.json
gh api --method POST repos/{owner}/{repo}/rulesets --input .github/rulesets/release-tags.json
```

`gh` fills in `{owner}` and `{repo}` from your clone, so you can paste these as they are. Rulesets are free for public
repositories; private repositories need a paid GitHub plan.

### 4. Install the All Contributors bot

The README's [Contributors](../README.md#contributors) section is kept up to date by the
[All Contributors](https://allcontributors.org) bot. Install it once: open
[github.com/apps/allcontributors](https://github.com/apps/allcontributors), click **Install** (or **Configure**), and
choose this repository.

To credit someone, comment on their issue or pull request:

```text
@all-contributors please add @username for code, doc
```

The bot updates [`.all-contributorsrc`](../.all-contributorsrc) and the README on an `all-contributors/...` branch and
opens a pull request into the default branch, which is `develop` after step 1. Merge it like any other pull request.
The [emoji key](https://allcontributors.org/en/reference/emoji-key/) lists every contribution type.

That's everything. The workflows ask for the permissions they need, so no Actions settings have to change.

### Adjusting the rulesets

- **Reviews.** The rulesets require `0` approving reviews, because GitHub doesn't let you approve your own pull
  request. When other people help maintain the bot, set `required_approving_review_count` to `1` (or edit the ruleset
  under **Settings → Rules → Rulesets**).
- **Emergency access.** Nobody can push straight to `main` or `develop`, admins included. To let admins merge a pull
  request without waiting for the rules, add yourself under **Bypass list** in the ruleset, or add
  `{ "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "pull_request" }` (the admin role) to
  `bypass_actors`.
- **Check names.** Required checks are matched by job name. If you rename a job in a workflow, or change the Node.js
  versions in [`ci.yml`](../.github/workflows/ci.yml), update the names in the rulesets too.

## Troubleshooting

| Problem                                                  | Fix                                                                                                                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source branch** fails on a pull request into `main`    | Only `develop` can be merged into `main`. Click **Edit** next to the pull request title and change the base branch to `develop`.                                |
| **Source branch** fails on a pull request into `develop` | Rename your branch so it starts with `feature/`, `bugfix/` or `release/` (`git branch -m feature/my-change`), push it and open a new pull request.              |
| **Release version** fails                                | That version is already released. Cut a release as described [above](#cutting-a-release) so `develop` has a new version.                                        |
| A required check says "Expected — Waiting for status"    | The check never ran, or its name doesn't match the ruleset. Compare the names in the ruleset with the job names in the workflows.                               |
| Dependabot or the All Contributors bot targeted `main`   | Bots open pull requests against the default branch. Make `develop` the default branch (step 1 of the setup), and change this pull request's base to `develop`.  |
| The release workflow failed after creating the release   | Open the run and click **Re-run failed jobs**. Only the failed jobs, such as the Docker image, run again.                                                       |
| You don't want a `develop` branch                        | Delete `.github/workflows/branch-rules.yml` and don't import the rulesets. Every push to `main` with a new version in `package.json` still publishes a release. |
