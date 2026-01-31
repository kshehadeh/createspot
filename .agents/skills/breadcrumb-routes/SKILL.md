---
name: breadcrumb-routes
description: Ensures breadcrumb updates when new page routes are added. Use when adding a new page route, a new about/admin/prompt subpage, or when the header breadcrumb shows the wrong or generic path for a URL.
---

# Breadcrumb Updates for New Routes

When you add a new page route, the header breadcrumb must be updated in two places or it will show a generic or incorrect path (e.g. "About" only instead of "About > Critiques").

## Why This Is Required

The app uses a **parallel route** slot `@breadcrumb`. Next.js matches the slot by **path**: for a URL like `/about/critiques`, it looks for `app/@breadcrumb/about/critiques/page.tsx`. If that file is missing, the slot falls back to a parent or default breadcrumb, so the header does not reflect the current page.

- **Route config** (`lib/routes.ts`) — Used for labels, parent chain, and fallback logic (e.g. `getBreadcrumbSegments` in the default breadcrumb).
- **Breadcrumb page** (`app/@breadcrumb/...`) — Renders the actual breadcrumb for that path when the slot is matched.

Both must be in sync for the breadcrumb to show the correct hierarchy and labels.

## When to Apply

- Adding a new page under `app/` that should show a specific breadcrumb (e.g. new `/about/foo`, `/admin/foo`, or other nested route).
- User reports that the breadcrumb is wrong or generic for a given URL.
- Adding or changing a route in `lib/routes.ts` that corresponds to a real page.

## How to Update

### 1. Add or update the route in `lib/routes.ts`

Define the new path with `path`, `label` (translation key or text), and `parentPath` if it has a parent:

```ts
// Example: about subpage
aboutCritiques: {
  path: "/about/critiques",
  label: "navigation.critiques",
  parentPath: "/about",
},
```

Use an existing `navigation.*` key from `messages/en.json` (and other locales) when possible, or an appropriate namespaced key.

### 2. Add a breadcrumb page under `app/@breadcrumb/`

Mirror the **exact path** of the new page under `app/@breadcrumb/`:

| New page route                 | Breadcrumb page to add                          |
|--------------------------------|--------------------------------------------------|
| `app/about/critiques/page.tsx` | `app/@breadcrumb/about/critiques/page.tsx`       |
| `app/admin/foo/page.tsx`       | `app/@breadcrumb/admin/foo/page.tsx`             |

### 3. Implement the breadcrumb page

Follow the pattern used by existing about subpages (e.g. `app/@breadcrumb/about/features/page.tsx`, `app/@breadcrumb/about/critiques/page.tsx`):

- Default export: async server component.
- Use `getTranslations("navigation")` and `getTranslatedRouteByPath(path, t)` from `@/lib/routes` for parent and current route labels.
- Render `<Breadcrumb segments={[...]} />`: parent segment(s) with `href`, last segment with label only (no `href`).

**Example (two-level: parent + current):**

```tsx
import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export default async function AboutCritiquesBreadcrumb() {
  const t = await getTranslations("navigation");
  const aboutRoute = getTranslatedRouteByPath("/about", t);
  const critiquesRoute = getTranslatedRouteByPath("/about/critiques", t);

  return (
    <Breadcrumb
      segments={[
        {
          label: aboutRoute?.label || t("about"),
          href: "/about",
          icon: aboutRoute?.icon,
        },
        { label: critiquesRoute?.label || t("critiques") },
      ]}
    />
  );
}
```

For deeper nesting (e.g. three or more segments), add one segment per level; only the last segment should omit `href`.

### 4. Translations (if using a new label key)

If the route uses a new key (e.g. `navigation.newKey`), add it to `messages/en.json` and `messages/es.json` under the `navigation` object.

### 5. Knip

`app/@breadcrumb/**` is already ignored in `knip.json` because these pages are discovered by Next.js via the filesystem, not by imports. Do not remove that ignore; new breadcrumb pages do not need to be added to Knip config.

## Quick Checklist

- [ ] Route added (or updated) in `lib/routes.ts` with `path`, `label`, and `parentPath` if applicable.
- [ ] File created at `app/@breadcrumb/<same-path-as-page>/page.tsx`.
- [ ] Breadcrumb page uses `getTranslatedRouteByPath` and `<Breadcrumb segments={...} />` with parent link(s) and current label.
- [ ] New translation keys added to messages if needed.

## Reference

- Route config and helpers: `lib/routes.ts`
- Existing breadcrumb pages: `app/@breadcrumb/about/`, `app/@breadcrumb/admin/`
- Default breadcrumb (fallback): `app/@breadcrumb/default.tsx` (uses `getBreadcrumbSegments` from `lib/routes.ts`)
