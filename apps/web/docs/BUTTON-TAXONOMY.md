# Button taxonomy (Create Spot web)

Shared vocabulary for interactive controls. Prefer these primitives before adding new patterns.

## Type A — Form and dialog actions

**Use:** Primary / secondary / destructive actions in `BaseModalFooter`, form submit rows, admin tables, inline “Retry” on errors.

**Primitive:** `Button` from `@createspot/ui-primitives/button` (source in `packages/ui-primitives/src/button.tsx`) with `variant` (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `fabFilled`, `fabMuted`, `overlayLight`, `overlayDark`) and `size` (`default`, `sm`, `lg`, `icon`).

**Navigation:** `Button asChild` wrapping `@/components/link` `Link` when the control navigates.

**Also aligned:** `AlertDialogAction` / `AlertDialogCancel` use `buttonVariants()` for the same look.

## Type B — Overlay / glass icon

**Use:** Round or capsule controls on imagery or dark overlays (lightbox chrome, carousel prev/next on photos).

**Primitives:**

- `Button` with `variant="overlayLight"` and `size="icon"` — frosted circle on **light** backgrounds (e.g. cards, in-page carousels).
- `Button` with `variant="overlayDark"` and `size="icon"` or `size="sm"` — glass on **dark** overlays (lightbox). `size="sm"` supports icon + label (e.g. “View”).
- [`CarouselNavButton`](../components/ui/carousel-nav-button.tsx) — prev/next chevrons; implemented with `Button` + `overlayLight` (optional `className` for dark surfaces, e.g. lightbox).

**Legacy alias:** `LIGHTBOX_BUTTON_CLASS` in [`base-lightbox.tsx`](../components/base-lightbox.tsx) matches `overlayDark` + `icon` for backwards compatibility; new code should use `variant="overlayDark"` on `Button`.

## Type C — Floating action (FAB)

**Use:** Fixed corner stacks with large hit targets (feed FAB, submission mobile chrome).

**Primitive:** `Button` with `variant="fabFilled"` (primary circle) or `variant="fabMuted"` (ringed neutral circle). Dimensions and motion are included in these variants (use default `size`).

**Also:** `Button asChild` + `Link` with `variant="fabMuted"` for circular navigation FABs.

## Type D — Intentional exceptions

**Keep raw `<button>`** (or headless patterns) when `Button` would fight focus behavior, density, or semantics:

- Tag chip remove, combobox / listbox rows (`user-autocomplete`, `user-selector`)
- Rich text toolbar ([`rich-text-editor.tsx`](../components/rich-text-editor.tsx))
- Theme segment control ([`theme-toggle.tsx`](../components/theme-toggle.tsx))
- Mobile shell / drawer triggers ([`mobile-navigation.tsx`](../components/mobile-navigation.tsx), [`mobile-nav-bar.tsx`](../components/mobile-nav-bar.tsx))
- Micro “read more” / disclosure ([`expandable-text.tsx`](../components/expandable-text.tsx))
- Some critique / selection UI in [`critiques-panel.tsx`](../components/critiques-panel.tsx) where controls are embedded in custom layouts

## Raw `<button>` inventory (classification)

| File | Role | Type |
|------|------|------|
| `portfolio-item-form.tsx` | Tag remove chip | D |
| `critiques-panel.tsx` | Embedded panel controls | D |
| `share-button.tsx` | Share menu trigger (`Button` + `DropdownMenu`) | A |
| `submission-create-wizard.tsx` | Wizard step UI | Review per instance |
| `profile-edit-form.tsx` | Inline controls | D / A |
| `dashboard/onboarding-section.tsx` | Dismiss / card action | A where applicable |
| `mobile-navigation.tsx` | Nav chrome | D |
| `feed-list.tsx` | FAB column | C |
| `app/(app)/welcome/page.tsx` | Marketing actions | A |
| `constellation-path.tsx` | Path UI | D |
| `feed-card.tsx` | Card overlay control | B / D |
| `submission-browser.tsx` | Browser chrome | A / D |
| `submission-detail.tsx` | Detail actions | A |
| `exhibition-grid.tsx` | Load-more retry | A |
| `featured-submission-selector.tsx` | Selector UI | A / D |
| `mobile-nav-bar.tsx` | Nav | D |
| `progression-strip.tsx` | Strip control | D |
| `mobile-title-dropdown.tsx` | Dropdown trigger | D |
| `collection-select-modal.tsx` | Modal list UI | A / D |
| `theme-toggle.tsx` | Segmented toggle | D |
| `selection-thumbnail.tsx` | Thumbnail pick | D |
| `ui/carousel-nav-button.tsx` | Carousel nav | B |
| `hint-popover.tsx` | Popover UI | D |
| `profile-header.tsx` | Header control | A |
| `user-autocomplete.tsx` | Combobox row | D |
| `user-selector.tsx` | List row | D |
| `expandable-text.tsx` | Text toggle | D |
| `rich-text-editor.tsx` | Toolbar | D |

## `Button` import inventory

All files importing `@createspot/ui-primitives/button` are expected to use type **A** unless they explicitly use `overlayLight`, `overlayDark`, `fabFilled`, or `fabMuted` (types **B** / **C**).

## `buttonVariants` usage outside `Button`

- [`alert-dialog.tsx`](../components/ui/alert-dialog.tsx) — Alert dialog actions (type A).
- [`creators/[creatorid]/page.tsx`](../app/(app)/creators/[creatorid]/page.tsx) — Link styled as button.
- [`collections/[collectionid]/page.tsx`](../app/(app)/creators/[creatorid]/collections/[collectionid]/page.tsx) — Link as button.
- [`portfolio-mobile-menu.tsx`](../components/portfolio-mobile-menu.tsx) — Menu trigger.

These should stay visually aligned with `Button` variants.
