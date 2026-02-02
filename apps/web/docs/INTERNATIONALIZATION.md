# Internationalization (i18n)

This document covers the translation system architecture, configuration, and usage patterns for the application.

> **Note**: This app uses **next-intl** for internationalization with profile-based language preferences. The language is stored in the user's database profile and synced to a cookie for fast access.

## Overview

The translation system supports:
- **English** (`en`) - Default language
- **Spanish** (`es`)

Users can change their language preference in their profile settings. Guest users get their language detected from their browser's `Accept-Language` header.

## Architecture

```
Request Flow:
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Browser/Client │────▶│    Proxy     │────▶│  Application    │
└─────────────────┘     └──────────────┘     └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ NEXT_LOCALE      │
                    │ Cookie           │
                    │ (set if missing) │
                    └──────────────────┘
```

### Key Components

| File | Purpose |
|------|---------|
| `i18n/config.ts` | Locale configuration, validation, display names |
| `i18n/request.ts` | Server-side request configuration for next-intl |
| `messages/en.json` | English translation strings |
| `messages/es.json` | Spanish translation strings |
| `proxy.ts` | Locale detection from cookie/browser |

### How Language is Determined

1. **Logged-in users**: Language preference is stored in the `User.language` field in the database
2. **Guest users**: Language is detected from the browser's `Accept-Language` header
3. **Cookie sync**: The `NEXT_LOCALE` cookie keeps the current locale for fast middleware access

When a user changes their language in profile settings:
1. The database `User.language` field is updated
2. The `NEXT_LOCALE` cookie is set in the response
3. The page reloads to apply the new locale

## File Structure

```
i18n/
├── config.ts              # Locale configuration and utilities
└── request.ts             # next-intl server configuration

messages/
├── en.json                # English translations
└── es.json                # Spanish translations

proxy.ts                   # Locale detection proxy
```

## Configuration

### Adding a New Locale

1. **Update `i18n/config.ts`**:

```typescript
// Add to locales array
export const locales = ["en", "es", "fr"] as const;

// Add display name
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
};
```

2. **Create message file** (`messages/fr.json`):

```json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler"
  }
}
```

3. **Run database migration** (if needed to update existing users)

## Usage

### Server Components

Use the async `getTranslations` function from `next-intl/server`:

```tsx
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("common");
  
  return (
    <div>
      <button>{t("save")}</button>
      <button>{t("cancel")}</button>
    </div>
  );
}
```

**With namespaces:**

```tsx
export default async function ProfilePage() {
  // Load specific namespace
  const t = await getTranslations("profile");
  
  return (
    <h1>{t("title")}</h1>
  );
}
```

**Multiple namespaces:**

```tsx
export default async function Page() {
  const tCommon = await getTranslations("common");
  const tProfile = await getTranslations("profile");
  
  return (
    <div>
      <h1>{tProfile("title")}</h1>
      <button>{tCommon("save")}</button>
    </div>
  );
}
```

### Client Components

Use the `useTranslations` hook from `next-intl`:

```tsx
"use client";

import { useTranslations } from "next-intl";

export function SaveButton() {
  const t = useTranslations("common");
  
  return <button>{t("save")}</button>;
}
```

### Variables (Interpolation)

Translation strings can include variables:

**In message file:**
```json
{
  "greeting": "Hello, {name}!",
  "itemCount": "You have {count} items"
}
```

**In component:**
```tsx
const t = useTranslations("common");

t("greeting", { name: "Sarah" });     // "Hello, Sarah!"
t("itemCount", { count: 5 });         // "You have 5 items"
```

### Pluralization

Use ICU message format for plurals:

**In message file:**
```json
{
  "followers": "{count, plural, =0 {No followers} =1 {One follower} other {# followers}}"
}
```

**In component:**
```tsx
t("followers", { count: 0 });   // "No followers"
t("followers", { count: 1 });   // "One follower"
t("followers", { count: 42 });  // "42 followers"
```

### Rich Text (with React Components)

For translations that need embedded components:

**In message file:**
```json
{
  "terms": "By signing up, you agree to our <link>Terms of Service</link>"
}
```

**In component:**
```tsx
t.rich("terms", {
  link: (chunks) => <a href="/terms">{chunks}</a>
});
```

### Number and Date Formatting

**In message file:**
```json
{
  "price": "Total: {amount, number, currency}",
  "posted": "Posted on {date, date, medium}"
}
```

**In component:**
```tsx
t("price", { amount: 29.99 });
t("posted", { date: new Date() });
```

## Message File Structure

The translation files use a nested namespace structure:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "loading": "Loading...",
    "delete": "Delete",
    "edit": "Edit"
  },
  "auth": {
    "signIn": "Sign in",
    "signOut": "Sign out"
  },
  "profile": {
    "title": "Profile",
    "language": "Language",
    "languageDescription": "Select your preferred language"
  },
  "navigation": {
    "home": "Home",
    "exhibits": "Exhibits"
  },
  "footer": {
    "copyright": "© {year} Create Spot"
  }
}
```

### Namespaces

| Namespace | Purpose |
|-----------|---------|
| `common` | Shared UI strings (buttons, labels, states) |
| `auth` | Authentication-related text |
| `profile` | Profile page and settings |
| `navigation` | Navigation links and menus |
| `footer` | Footer content |

## Database Schema

The `User` model includes a `language` field:

```prisma
model User {
  // ... other fields
  language String @default("en") // ISO 639-1 code: "en", "es"
}
```

## API Integration

### Profile API

The `/api/profile` endpoint handles language updates:

```typescript
// PUT /api/profile
{
  "language": "es"
}
```

When language is updated:
1. Database `User.language` is updated
2. `NEXT_LOCALE` cookie is set in response
3. Client should reload to apply changes

### Changing Language in UI

The profile edit form includes a language selector that:

```tsx
const handleLanguageChange = async (newLanguage: string) => {
  const response = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language: newLanguage }),
  });
  
  if (response.ok) {
    window.location.reload(); // Apply new locale
  }
};
```

## Best Practices

### 1. Use Namespaces

Organize translations by feature/page:

```tsx
// Good - specific namespace
const t = await getTranslations("profile");

// Avoid - loading all translations
const t = await getTranslations();
```

### 2. Keep Keys Descriptive

```json
{
  "profile": {
    "editButton": "Edit Profile",
    "saveSuccess": "Profile saved successfully",
    "saveError": "Failed to save profile"
  }
}
```

### 3. Avoid Concatenation

```tsx
// Bad - breaks translation
t("hello") + " " + name

// Good - use variables
t("greeting", { name })
```

### 4. Handle Missing Translations

next-intl shows the key if translation is missing. Always add translations to both language files.

### 5. Server Components First

Prefer `getTranslations` in Server Components for better performance:

```tsx
// Server Component - translations loaded at request time
export default async function Page() {
  const t = await getTranslations("common");
  return <h1>{t("title")}</h1>;
}
```

### 6. Keep Translations Synchronized

When adding a new translation key:
1. Add to `messages/en.json`
2. Add to `messages/es.json`
3. Test both languages

## Adding Translations to Existing Code

### Step-by-Step Process

1. **Identify hardcoded strings** in your component
2. **Add keys to message files** (`en.json` and `es.json`)
3. **Import translation function**:
   - Server Component: `import { getTranslations } from "next-intl/server"`
   - Client Component: `import { useTranslations } from "next-intl"`
4. **Replace hardcoded strings** with `t("key")`

### Example Migration

**Before:**
```tsx
export default function Page() {
  return (
    <div>
      <h1>Profile</h1>
      <button>Save</button>
    </div>
  );
}
```

**After:**
```tsx
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("profile");
  const tCommon = await getTranslations("common");
  
  return (
    <div>
      <h1>{t("title")}</h1>
      <button>{tCommon("save")}</button>
    </div>
  );
}
```

## Troubleshooting

### Translation Not Updating

1. Check the `NEXT_LOCALE` cookie is set correctly
2. Verify the message file has the key
3. Clear browser cache and reload

### Missing Translation Shows Key

The key is shown when:
- The translation key doesn't exist in the message file
- There's a typo in the key name
- The namespace is incorrect

### Cookie Not Being Set

Ensure the proxy is running and matching the route:

```typescript
// proxy.ts - check matcher config
export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
```

## Related Documentation

- [Frontend Architecture](./FRONTEND.md) - Component patterns and styling
- [Database Schema](./DATABASE.md) - User model and migrations
