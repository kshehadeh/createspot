---
name: changelog
description: User-facing changes are communicated via Git commit messages and GitHub Releases, not JSON changelog files.
---

# Changelog (GitHub Releases)

The project **no longer uses** `apps/web/changelogs/*.json`.

- **Write clear commits** on `main` (conventional style helps: `feat:`, `fix:`, `chore:`, etc.). Release notes for each tag are generated in CI from `git log` between the previous `v*` tag and the new tag.
- The **About → Updates** page loads public **GitHub Releases** for `CHANGELOG_GITHUB_REPO` (see `.env.example`).
- **Discord** announcements use the same release body as GitHub, posted by the release workflow after deploy.

When documenting work for users, prefer commit messages and PR descriptions that read well as one line in a release-notes list.
