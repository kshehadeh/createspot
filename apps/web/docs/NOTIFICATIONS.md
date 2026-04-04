# Notifications (cron & logs)

## Current behavior

Scheduled jobs hit `GET /api/cron/notifications` with the `Authorization: Bearer CRON_SECRET` header (when `CRON_SECRET` is set).

The handler uses Next.js `after()` to run the **badge awards** workflow (`checkBadgeAwards`) asynchronously. It does **not** send weekly prompt emails; that product path was removed.

## `NotificationLog`

The `NotificationLog` model remains for historical rows. Legacy types such as `NEW_PROMPT` may still exist in the database from older releases. New code should not depend on prompt-specific notification flows.

Admin-facing notification configuration lives under `/admin/notifications` (see app routes).

## Environment

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Authorizes the cron HTTP caller |
| `DATABASE_URL` | Required for badge checks and logging |

## Related code

- `app/api/cron/notifications/route.ts` — cron entrypoint
- `app/(app)/workflows/check-badge-awards.ts` — badge evaluation workflow
- `lib/notifications/metadata.ts` — display labels for notification types in admin UI
