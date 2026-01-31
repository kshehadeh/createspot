---
name: update-documentation
description: How to add or change project documentation. Use when adding docs, updating docs, or when the user asks how documentation should be organized or where to put new docs.
---

# Updating Documentation

Use this skill when adding or changing project documentation.

## Location

- **All docs live in the `docs/` folder** at the project root.
- **Use UPPERCASE for doc filenames** (e.g. `DATABASE.md`, `FRONTEND.md`, `IMAGE-HANDLING.md`).

## Colocation

- **Colocate related content.** Do not create new files for small or granular changes. Prefer updating an existing doc that already covers the topic.
- **One doc per major feature or architectural concept.** Group related sections in the same file (e.g. auth flows, database schema, image handling).
- **Avoid fragmentation.** If a change is a new section or a few paragraphs that fit an existing doc, add it there. Create a new file only when you are documenting a new major feature or concept that does not belong in any existing doc.

## Workflow

1. **Decide where the content belongs:** Check existing files in `docs/` and pick the one that matches the feature or concept.
2. **Edit in place:** Add or update sections in that file. Use clear headings so the doc stays scannable.
3. **New file only when needed:** If the topic is a new major feature or concept with no suitable existing doc, create a new file in `docs/` with a UPPERCASE name (e.g. `NEW_FEATURE.md`).

## Examples

- Adding a note about a new API route for settings → update `docs/SITE_SETTINGS.md` (or the doc that covers that area), do not create `docs/API_SETTINGS_ROUTE.md`.
- Documenting a new subsystem (e.g. “Export”) → create `docs/EXPORT.md` if no existing doc fits.
- Small clarification to image upload flow → update `docs/IMAGE-HANDLING.md`, do not add a new file.
