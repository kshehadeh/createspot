# Stitch CreateSpot Mapping Checklist

This checklist maps prioritized Stitch screens to the current Next.js code paths for implementation and QA.

## Dashboard Screens

- Stitch desktop: `projects/5528897607243807402/screens/a52d2e7ad8904080ad2386cf0fd6c6b8`
- Stitch mobile: `projects/5528897607243807402/screens/76a5d74e8ef14d46b7d037ff4e26ca62`

### Code Targets

- Route shell: `apps/web/app/(app)/dashboard/page.tsx`
- Dashboard container: `apps/web/components/dashboard.tsx`
- Shared section wrapper: `apps/web/components/dashboard-section.tsx`
- Sections:
  - `apps/web/components/dashboard/onboarding-section.tsx`
  - `apps/web/components/dashboard/portfolio-section.tsx`
  - `apps/web/components/dashboard/recent-views-section.tsx`
  - `apps/web/components/dashboard/dashboard-analytics-section.tsx`
  - `apps/web/components/dashboard/critiques-section.tsx`
  - `apps/web/components/dashboard/following-section.tsx`
  - `apps/web/components/dashboard/badges-section.tsx`

### Desktop Parity Checks

- Hero greeting prominence and spacing hierarchy.
- Card elevation and tonal stacking consistency across all sections.
- CTA hierarchy (`default`, `outline`, icon actions) aligned with gallery system.
- Metadata contrast (`foreground` vs `on-surface-variant`) and list density.

### Mobile Parity Checks

- Section stack order and vertical spacing rhythm.
- Tap targets for card links and icon buttons.
- Compact typography scale with readable metadata.
- Overflow regions (thumbnail grids/charts) remain usable.

## Portfolio Screens

- Stitch desktop: `projects/5528897607243807402/screens/1e09b74acaba4705aba37506ea43f0bc`
- Stitch mobile: `projects/5528897607243807402/screens/a5e7fb6156344de7a4ee4638d4794000`

### Code Targets

- Route: `apps/web/app/(app)/creators/[creatorid]/portfolio/page.tsx`
- Owner body: `apps/web/components/portfolio-page-body.tsx`
- Mobile owner header/filter: `apps/web/components/portfolio-mobile-menu.tsx`
- Portfolio grids:
  - `apps/web/components/profile-page-portfolio-grid.tsx`
  - `apps/web/components/portfolio-grid.tsx`

### Desktop Parity Checks

- Header/title/action cluster visual hierarchy.
- Portfolio card framing and overlay readability.
- Selection and bulk actions visual rhythm and grouping.
- Empty states and helper text tone consistency.

### Mobile Parity Checks

- Mobile menu header, filters panel, and action controls match spacing rhythm.
- Grid card behavior and overlays remain legible on small screens.
- Selection mode controls are clear and tappable.
- Modal/panel layering remains consistent with glass + tonal depth rules.

