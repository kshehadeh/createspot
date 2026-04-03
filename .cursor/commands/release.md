Run a release from the repo root with a clean `main` branch and all work already committed:

```bash
bun run release
```

This bumps `apps/web/package.json`, commits, tags `v*`, and pushes. GitHub Actions then deploys to Vercel, creates the GitHub Release, and posts to Discord when secrets are configured.

To preview Discord formatting locally (no post):

```bash
DISCORD_RELEASE_BODY=$'## Changes\n\n- ...' DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." GITHUB_REF_NAME="v0.0.0" bun run --cwd apps/web changelog:discord --dry-run
```
