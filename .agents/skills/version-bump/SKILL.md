---
name: version-bump
description: Reads unreleased changelog entries, determines the next semantic version, updates package.json, and stamps changelog entries with the new version.
---

# Version Bump From Changelog

## Purpose
Use the JSON changelogs in `changelogs/` to decide when and how to bump the app version, then:
1) update `package.json` version
2) update all unreleased changelog entries with the new version

## Changelog Entry Fields
Changelog entries may include:
- `impact`: `patch` | `minor` | `major`
- `version`: optional string (missing/empty means unreleased)

## Rules
1. **Unreleased entries** are those where `version` is missing, `null`, or an empty string.
2. Determine the **highest** impact among unreleased entries:
   - `major` > `minor` > `patch`
3. If there are **no** unreleased entries, do not change anything; report that there is nothing to release.
4. Determine the next version from current `package.json` version using SemVer:
   - `patch`: `X.Y.Z` -> `X.Y.(Z+1)`
   - `minor`: `X.Y.Z` -> `X.(Y+1).0`
   - `major`: `X.Y.Z` -> `(X+1).0.0`

## Steps
1. Read `package.json` and record the current version.
2. Read all `changelogs/*.json` files.
3. Collect unreleased entries and compute the highest required `impact`.
4. Calculate the new version.
5. Update `package.json` with the new version.
6. Update all unreleased changelog entries by setting `version` to the new version.
7. Do **not** modify released changelog entries.

## Output
Return:
- The previous version and new version
- Count of entries stamped
- Which impact level was used (patch/minor/major)
- Which changelog files were modified

## Safety
- Never invent changelog entries.
- Never change `time`, `commit`, `type`, `area`, or `description` fields.
- Do not bump the version if there are no unreleased entries.
