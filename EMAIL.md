# Email Infrastructure

## Environment Variables

Set the following variables in `.env.local` (and keep `.env.example` in sync):

- `RESEND_API_KEY`: Server-side key from the Resend dashboard with sending access.
- `RESEND_FROM_EMAIL`: Default "From" identity, e.g. `Prompts <hello@yourdomain.com>`; must match a verified Resend domain or sender.
- `MAILING_ADDRESS`: (Optional) Physical mailing address shown in email footers. **CAN-SPAM** requires a physical address in commercial/transactional emails; set this (e.g. `"Your Company, 123 Main St, City, State ZIP"`) to stay compliant.

## Sending Emails

The `EmailService` in `@/lib/email/email-service` powers all outbound mail. Most callers should import the helper from the barrel:

```ts
import { sendEmail } from "@/lib/email";
import { WelcomeEmail } from "@/emails/templates/welcome-email";

await sendEmail({
  to: user.email,
  subject: "Welcome to Prompts",
  react: <WelcomeEmail name={user.name} />,
});
```

`sendEmail` requires either a `react` component (preferred) or `text` content. Use `sendPlainEmail` for simple text-only deliveries. Both functions will throw an `EmailSendError` if configuration is missing or Resend reports a failure.

### Reliability (idempotency and retry)

- **Idempotency**: Pass `idempotencyKey` (e.g. `welcome-user/${userId}`) so retries do not send duplicate emails. Resend caches keys for 24 hours. Use deterministic keys based on the business event.
- **Retry**: The service retries on 5xx and 429 with exponential backoff (up to 3 attempts). No need to retry 4xx client errors.

## Templates & Layouts

- Shared primitives live under `emails/components/` (e.g., `EmailButton`, `EmailText`).
- Layouts belong in `emails/layouts/` and should wrap content in consistent styling (`BaseEmail`).
- Individual transactional templates reside in `emails/templates/`. Export both the component and its props interface for reuse.

To preview or debug a template outside Resend, use the renderer helper:

```ts
import { renderEmailTemplate } from "@/lib/email";
import { WelcomeEmail } from "@/emails/templates/welcome-email";

const { html, text } = await renderEmailTemplate(<WelcomeEmail name="Ava" />);
```

All email sends must originate from server-side contexts (API routes, server actions, cron jobs) because the Resend API key lives on the server only.

## Compliance and deliverability

- **CAN-SPAM**: Set `MAILING_ADDRESS` so the physical address appears in the `BaseEmail` footer. The footer also includes a “Manage notifications” link to the profile edit page.
- **List-Unsubscribe**: Notification flows (welcome, new follower, favorite, critique, new prompt, badge) pass `listUnsubscribeHeaders(preferencesUrl)` so providers (Gmail, Yahoo, etc.) can show an unsubscribe option; the URL points to the profile edit page where users manage email preferences.
- **Consent**: Notification emails are only sent when the user has the corresponding preference enabled (e.g. `emailOnFavorite`). Users can change these in profile settings.
