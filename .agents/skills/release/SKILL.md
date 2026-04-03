---
name: release
description: Perform a full release: check for changes since last release, update changelogs, bump version, commit, and push to remote.
---

# Release

This skill performs a complete release workflow: document changes, bump version, commit, and push.

## Workflow

### Step 1: Find Commits Since Last Release

1. Find the last release commit by searching for "chore(release)" or "bump version" in git log
2. List all commits since that release
3. Check which commits are already documented in `apps/web/changelogs/*.json`

### Step 2: Document Undocumented Commits

For each undocumented commit, create changelog entries following the changelog skill format:

```json
{
  "time": "ISO datetime",
  "commit": "short sha",
  "type": "fix | improvement | feature | documentation",
  "audience": "public | development",
  "area": "global | content | profile | portfolio | collection | games | tools",
  "description": "Brief one-sentence description",
  "impact": "patch | minor | major",
  "version": ""
}
```

**Entry Rules:**
- `patch`: bug fixes, small improvements, documentation
- `minor`: new features or notable user-facing improvements  
- `major`: breaking changes
- A single commit may have multiple entries if it contains multiple discrete changes
- Multiple commits for the same feature should be consolidated into one entry
- Do NOT duplicate entries - check existing changelogs first

**Area Definitions:**
- Global: Navigation, Authentication
- Content: About pages, home page, etc
- Portfolio: Viewing, editing, sharing portfolios
- Collections: Viewing, editing, creating, sharing collections
- Games: Prompt and other inspiration games
- Tools: Image editor

### Step 3: Version Bump

1. Read current version from `apps/web/package.json`
2. Find all unreleased entries (where `version` is empty or missing)
3. Determine highest impact among unreleased entries: `major` > `minor` > `patch`
4. If no unreleased entries exist, report "nothing to release" and stop
5. Calculate new version:
   - `patch`: `X.Y.Z` -> `X.Y.(Z+1)`
   - `minor`: `X.Y.Z` -> `X.(Y+1).0`
   - `major`: `X.Y.Z` -> `(X+1).0.0`
6. Update `apps/web/package.json` with new version
7. Stamp all unreleased entries with the new version

### Step 4: Commit Changes

1. Stage all modified files:
   - `apps/web/package.json`
   - `apps/web/changelogs/*.json`
2. Create commit with message:
   ```
   chore(release): bump version to X.Y.Z
   ```
3. Include co-authorship in commit

### Step 5: Push to Remote

Push the commits to the remote repository.

### Step 6: Post Changelog to Discord

After successfully pushing, post the changelog to Discord:

```bash
bun run changelog:discord
```

This uses the `changelog:discord` script which runs `bun scripts/post-changelog-to-discord.ts`.

**Requirements:**
- `DISCORD_WEBHOOK_URL` environment variable must be set
- If the webhook is not configured, skip this step with a note

**Options:**
- `--dry-run` can be used to preview the message without posting

## Output

Report:
- Previous version and new version
- Number of changelog entries added
- Number of entries stamped with version
- Impact level used
- Commit SHA created
- Push status
- Discord post status (posted, skipped, or dry-run)

## Safety

- Never modify existing `version` values in changelogs
- Never change `time`, `commit`, `type`, `area`, or `description` fields
- Do not release if there are no unreleased entries
- Always verify git status before committing
