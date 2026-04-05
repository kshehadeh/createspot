# User Flow & Sitemap

High-level map of the Create Spot app after the portfolio- and social-first product shape (weekly admin prompts were removed; old `/inspire/prompt/*` URLs redirect to the exhibition).

## Core routes (simplified)

| Area | Path | Notes |
|------|------|--------|
| Home / feed | `/` | Public feed (logged-in users get followed-first ordering server-side). |
| Welcome / sign-in | `/welcome`, `/auth/signin` | Onboarding and auth. |
| Inspire | `/inspire` → exhibition | Permanent exhibit and curated exhibits live under `/inspire/exhibition`. |
| Gallery views | `/inspire/exhibition/gallery/grid`, `/inspire/exhibition/gallery/path`, `/inspire/exhibition/global` | Grid, path (“constellation”), and global views. |
| Favorites | `/inspire/favorites` | Authenticated. |
| Community | `/inspire/community` | Following-focused discovery. |
| Creators | `/creators`, `/creators/[creatorid]` | Directory and public profiles. |
| Portfolio | `/creators/[creatorid]/portfolio`, `/creators/[creatorid]/portfolio/edit` | Public portfolio and owner edit UI. |
| Submission | `/creators/[creatorid]/s/[submissionid]` (+ `/edit`, `/critiques`, …) | Canonical submission pages. |
| Collections | `/creators/[creatorid]/collections`, `.../[collectionid]`, `.../edit` | Per-creator collections. |
| Dashboard | `/dashboard` | Authenticated hub. |
| Admin | `/admin`, `/admin/users`, `/admin/exhibits`, `/admin/notifications`, `/admin/settings` | Admin only. |
| About | `/about`, `/about/purpose`, `/about/features`, … | Marketing / help-style pages. |

🔒 = requires authentication; admin pages also require `isAdmin`.

## Typical flows

**New creator:** Sign in → complete profile → open portfolio edit → add pieces → set share level → appear in public exhibit/feed when `PUBLIC` + `isPortfolio`.

**Browser:** Open `/` or `/inspire/exhibition` → open a submission → visit creator profile → browse portfolio → favorite from submission or grid.

**Admin:** `/admin` → manage users or exhibits → configure notifications in `/admin/notifications`.

## Redirects

Legacy bookmarked URLs such as `/inspire/prompt/play` and `/admin/prompts` are redirected via `next.config.ts` (see redirects there).
