# Authentication

This document describes how authentication and session management work in the app.

## Overview

Authentication is handled by **NextAuth.js** with **Google OAuth** and a **PrismaAdapter** backed by PostgreSQL. Sessions are stored in the database and surfaced to the app via `auth()` on the server and `useSession()` on the client.

## Key Entry Points

### NextAuth configuration

- **File:** `lib/auth.ts`
- **Exports:** `handlers`, `signIn`, `auth`
- **Provider:** Google OAuth
- **Adapter:** `PrismaAdapter(prisma)`

The `auth()` helper is used throughout server components and API routes to fetch the current session.

### API route

- **File:** `app/api/auth/[...nextauth]/route.ts`
- **Exports:** `GET`, `POST` from `handlers`

This exposes the NextAuth endpoints at `/api/auth/*`.

### Sign-in page

- **File:** `app/auth/signin/page.tsx`
- **Flow:** Server Action calls `signIn("google", { redirectTo: "/" })`

The custom sign-in page is configured via `pages.signIn = "/auth/signin"` in `lib/auth.ts`.

## Environment Variables

Defined in `.env.example`:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET` (or `AUTH_SECRET` as fallback)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Session Shape & Enrichment

The session is extended in `types/next-auth.d.ts` and enriched in the NextAuth `session` callback:

- `user.id` (from Prisma)
- `user.isAdmin`
- `user.profileImageUrl`
- `user.slug`

On session creation, a welcome email is sent once per user via `sendWelcomeEmailIfNeeded`.

## Server-Side Usage

Use `auth()` in server components or API routes to fetch the session and gate access.

```ts
import { auth } from "@/lib/auth";

const session = await auth();
if (!session?.user) {
  // Handle unauthenticated access
}

if (!session?.user?.isAdmin) {
  // Handle non-admin access
}
```

## Client-Side Usage

The root layout wraps the app with `SessionProvider` (`app/layout.tsx`). Client components can access session state and auth actions via `next-auth/react`.

```tsx
import { useSession, signIn, signOut } from "next-auth/react";

const { data: session } = useSession();
// signIn("google");
// signOut();
```

## Authorization Patterns

- **Authenticated-only**: `if (!session?.user)` → `401` or redirect
- **Admin-only**: `if (!session?.user?.isAdmin)` → `403` or redirect
- **Ownership**: compare `session.user.id` with resource owner ID

These checks are common in API routes (e.g., `app/api/*`) and in server pages for admin sections.

## Data Model

Prisma includes NextAuth models and a `User` model that stores app-specific fields:

- `Account`, `Session`, `VerificationToken` (NextAuth)
- `User.isAdmin`, `User.profileImageUrl`, `User.slug`, `User.welcomeEmailSent`

## Cookies & Security Notes

- Secure cookie names are used when `NEXTAUTH_URL` is HTTPS.
- PKCE code verifier cookies are set with `httpOnly`, `sameSite: "lax"`, and `secure` when applicable.
- CSRF protection is handled by NextAuth automatically.
