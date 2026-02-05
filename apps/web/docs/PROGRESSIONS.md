# Progressions

Progressions are work-in-progress steps associated with a submission. They let creators show how a piece evolved (e.g. early sketch → draft → final). Each progression can have an image, rich text, a comment, or a combination.

## Concepts

| Term | Description |
|------|-------------|
| **Progression** | A single step in the journey of a submission (image and/or text, plus optional comment). |
| **text** | The creative work itself at this step (rich HTML, like submission text). Displayed in the lightbox sidebar or overlay. |
| **comment** | A short note about the step (e.g. "First draft before adding color"). Plain text, shown as caption/tooltip. |
| **order** | 0-based display order; lower = earlier in the journey. |

A progression must have at least **image** or **text**. Comment is optional.

## Data model

The `Progression` model lives in [prisma/schema.prisma](../prisma/schema.prisma):

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID primary key |
| submissionId | String | Parent submission (cascade delete) |
| imageUrl | String? | Optional image URL (R2) |
| text | String? | Optional rich HTML (creative content) |
| comment | String? | Optional plain-text note about the step |
| order | Int | Display order (0-indexed) |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

Indexes: `submissionId`, `(submissionId, order)`.

Submissions have a one-to-many relation: `Submission.progressions` → `Progression[]`.

## R2 storage

Progression images are stored in R2 under a dedicated prefix:

- **Path:** `progressions/{submissionId}/{uuid}.{ext}`
- **Presign:** `POST /api/upload/presign` with `type: "progression"` and `submissionId`. The API checks that the authenticated user owns the submission before issuing the URL.
- **No post-processing:** Progression images are stored as uploaded (no resize/watermark workflow). They are not used as the main submission image.

See [IMAGE-HANDLING.md](IMAGE-HANDLING.md) for the general presign flow; progression is an additional `type` alongside `submission` and `profile`.

## API

All progression APIs require the user to own the submission (except GET, which respects submission visibility).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/submissions/[id]/progressions` | List progressions for a submission (ordered by `order`). Respects submission `shareStatus` (e.g. PRIVATE only for owner). |
| POST | `/api/submissions/[id]/progressions` | Create a progression. Body: `{ imageUrl?, text?, comment? }`. At least one of `imageUrl` or `text` required. `order` is set to max+1. |
| PUT | `/api/submissions/[id]/progressions/[progressionId]` | Update a progression. Body: `{ imageUrl?, text?, comment?, order? }`. Must still have image or text after update. |
| DELETE | `/api/submissions/[id]/progressions/[progressionId]` | Delete a progression and its R2 image (if any). |
| PUT | `/api/submissions/[id]/progressions/reorder` | Bulk reorder. Body: `{ items: Array<{ id, order }> }`. All items must belong to the submission. |

Routes live under [app/api/submissions/[id]/progressions/](../app/api/submissions/[id]/progressions/).

## Edit form

Progressions are edited only when **editing an existing submission** (they require a submission ID).

- **Component:** [components/progression-editor.tsx](../components/progression-editor.tsx)
- **Used in:** [components/portfolio-item-form.tsx](../components/portfolio-item-form.tsx) when `mode === "edit"` and `initialData.id` is set.
- **Data source:** The submission edit page ([app/creators/[creatorid]/s/[submissionid]/edit/page.tsx](../app/creators/[creatorid]/s/[submissionid]/edit/page.tsx)) includes `progressions` in the submission query and passes them in `initialData`.

The editor supports:

- **Add** – New progression (image and/or text, optional comment). Image upload uses presign with `type: "progression"` and `submissionId`.
- **Edit** – Change image, text, or comment for an existing progression.
- **Delete** – Mark for deletion (or remove if unsaved); R2 image is deleted on save.
- **Reorder** – Drag-and-drop; order is persisted on form submit.

On submit, the form:

1. Deletes progressions marked deleted (DELETE API).
2. Creates new progressions (POST API).
3. Updates modified progressions (PUT API).
4. Calls the reorder API if order changed (PUT reorder).

## View (submission page)

On the submission view page, progressions are shown below the main content when present.

- **Strip:** [components/progression-strip.tsx](../components/progression-strip.tsx) – Horizontal row of thumbnails (image or text icon), step number, optional comment tooltip, arrows between items. Clicking a thumbnail opens the lightbox.
- **Lightbox:** [components/progression-lightbox.tsx](../components/progression-lightbox.tsx) – Full-screen viewer with prev/next, zoom (desktop hover / mobile pinch), text sidebar, comment caption, and optional text overlay on mobile.
- **Download as GIF:** When the submission has at least two progression images, the owner sees a "Download progressions as GIF" option in the submission page download dropdown ([components/collection-download-dropdown.tsx](../components/collection-download-dropdown.tsx)). The GIF is built server-side from the ordered progression images (frame delay 1s) via `GET /api/submissions/[id]/download/gif`. When the submission has a main image, it is appended as the final frame so the GIF ends with the actual final piece.

Data is loaded with the submission: the submission page ([app/creators/[creatorid]/s/[submissionid]/page.tsx](../app/creators/[creatorid]/s/[submissionid]/page.tsx)) includes `progressions` (ordered by `order`) in the Prisma select and passes them to [components/submission-detail.tsx](../components/submission-detail.tsx), which renders `ProgressionStrip` when `submission.progressions` has items.

## Lightbox architecture

Progression and submission lightboxes share behavior via a base component:

- **[components/base-lightbox.tsx](../components/base-lightbox.tsx)** – Generic lightbox: zoom (hover on desktop, pinch on mobile), prev/next, keyboard and swipe, slide transitions, optional download protection. Accepts an `item` (id, imageUrl, text, title), `navigation` (prev/next + labels), and render props for controls, sidebar, metadata overlay, and text overlay.
- **[components/submission-lightbox.tsx](../components/submission-lightbox.tsx)** – Uses `BaseLightbox` with submission-specific controls (view, edit, critique, share, close) and sidebar/metadata content.
- **[components/progression-lightbox.tsx](../components/progression-lightbox.tsx)** – Uses `BaseLightbox` with progression-specific labels (e.g. “Step 1 of 3”), comment as caption, and close control.

So progressions get the same zoom/navigation behavior as submissions, with different labels and content.

## i18n

Progression UI strings live under the `progression` key in [messages/en.json](../messages/en.json) and [messages/es.json](../messages/es.json): titles, buttons (add/edit/delete, reorder), step labels, placeholders, validation messages, lightbox labels. See [INTERNATIONALIZATION.md](INTERNATIONALIZATION.md) for how to use them.
