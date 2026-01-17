# Email Infrastructure

## Environment Variables

Set the following variables in `.env.local` (and keep `.env.example` in sync):

- `RESEND_API_KEY`: Server-side key from the Resend dashboard with sending access.
- `RESEND_FROM_EMAIL`: Default "From" identity, e.g. `Prompts <hello@yourdomain.com>`; must match a verified Resend domain or sender.

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
