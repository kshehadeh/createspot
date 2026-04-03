---
name: release
description: Run the automated release script to bump version from git commits, tag, and push; CI publishes GitHub Release and Discord.
---

# Release

Releases are driven by **`bun run release`** at the repo root ([`scripts/release.ts`](scripts/release.ts)).

## What the script does

1. Ensures current branch is `main` (override with `RELEASE_BRANCH`).
2. Ensures a clean working tree (no uncommitted changes).
3. Finds the latest `v*` tag merged into `HEAD` and lists commits since that tag; aborts if there is nothing new.
4. Chooses **minor** if any commit subject matches conventional `feat:` / `feat(scope):` / `feature:`; otherwise **patch**. Breaking-change markers are **not** used for the bump level.
5. Bumps `apps/web/package.json` version accordingly.
6. Commits with `chore(release): bump version to X.Y.Z`, creates annotated tag `vX.Y.Z`, pushes `main` and the tag.

## After push

Pushing `v*` triggers [`release.yml`](../../../.github/workflows/release.yml), which deploys to Vercel, creates or updates the GitHub Release (notes from `git log` since the previous tag), and posts the same notes to Discord when `DISCORD_WEBHOOK_URL` is set.

## Maintainer setup

- **GitHub Actions:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, optional `DISCORD_WEBHOOK_URL`.
- **App (Vercel env):** `CHANGELOG_GITHUB_REPO` (`owner/repo`), optional `GITHUB_TOKEN` for the About changelog page.

## Local Discord test (optional)

```bash
DISCORD_RELEASE_BODY="## Changes\n\n- example" DISCORD_WEBHOOK_URL="..." GITHUB_REF_NAME="v1.0.0" bun run --cwd apps/web changelog:discord --dry-run
```

## Output

Report whether the script ran, new version, tag name, and that CI will handle GitHub + Discord.
