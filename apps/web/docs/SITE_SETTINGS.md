# Site Settings

This document describes global (non-user) settings managed by admins.

## Homepage hero source

The homepage hero background can be powered by either:

1. **An Exhibit** (carousel)
2. **Latest submissions** (carousel)
3. **A selected public submission** (static hero image)

### Admin UI

Configure via **Admin → Site Settings** (`/admin/settings`).

Options:

- **Select Exhibit**: Choose an exhibit whose submissions appear in the homepage carousel.
- **When no exhibit is selected**:
  - **Show latest submissions** (default)
  - **Show default hero image** (requires selecting a public submission with an image)

### Behavior on the homepage

Implementation lives in `app/page.tsx`.

Resolution order:

1. If a homepage exhibit is set and it has eligible submissions → render `RecentSubmissionsCarousel` from that exhibit (ordered by `ExhibitSubmission.order`, limited to 8).
2. Else if fallback is `hero` and a hero submission is set → render a single static hero image (links to the submission).
3. Else → render `RecentSubmissionsCarousel` from latest public submissions (limited to 8).

Eligibility rules:

- Exhibit/Latest carousel items: `shareStatus=PUBLIC` and has `imageUrl` **or** `text`.
- Static hero submission: `shareStatus=PUBLIC` and must have `imageUrl`.

### Storage

Settings are stored in the database in the `SiteSetting` table as key/value pairs:

- `homepageCarouselExhibitId` (string)
- `homepageCarouselFallback` (`latest` | `hero`)
- `homepageHeroSubmissionId` (string)

Helper functions live in `lib/settings.ts`.

### Admin API

Admin-only API route:

- `GET /api/admin/settings`
- `PUT /api/admin/settings`

The API validates:

- Exhibit must exist (if provided)
- Hero submission must exist, be `PUBLIC`, and have `imageUrl` (if provided)
