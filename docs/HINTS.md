# Hints System

This document covers the contextual help and hint system that guides users through the application's features.

## Overview

The hints system provides non-intrusive, contextual guidance to users within the app. Hints are popovers that can appear with arrows pointing to specific elements (target-based hints) or as fixed-position hints (like "Did You Know" tips) in the corner of the screen. They're shown once per user and can be dismissed, with their state persisted in the database.

## Architecture

### Components

- **`HintPopover`** (`components/hint-popover.tsx`) - The core component that renders individual hints
- **`GlobalHints`** (`components/global-hints.tsx`) - Manages global hints that appear on all pages
- **`TutorialManager`** (`lib/tutorial-manager.ts`) - Class that manages hint state and logic

### Data Storage

Hints are stored in the `tutorial` field on the `User` model (JSON blob):

```typescript
// Prisma schema
model User {
  tutorial Json @default("{\"status\": \"enabled\", \"global\": {}}")
  // ...
}
```

### Data Structure

The `tutorial` JSON blob has the following structure:

```json
{
  "status": "enabled",
  "global": {
    "exhibits": {
      "order": 1,
      "seen": false,
      "dismissedAt": null
    },
    "creators": {
      "order": 2,
      "seen": true,
      "dismissedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "profile": {
    "portfolio": {
      "order": 1,
      "seen": false,
      "dismissedAt": null
    }
  }
}
```

**Fields:**
- `status`: `"enabled"` | `"disabled"` - Controls whether tutorials show globally
- `global`: Global hints that can appear on any page
- `[page]`: Page-specific hints (e.g., `"profile"`, `"prompt"`, `"portfolio"`)
- `[hintKey]`: Unique identifier for the hint
  - `order`: Display order for hints on that page (lower numbers shown first)
  - `seen`: Boolean indicating if the user has dismissed this hint
  - `dismissedAt`: ISO timestamp of when the hint was dismissed (or `null`)

## Hint Types

### Global Hints

Global hints appear on any page and are typically tied to global elements like navigation items. They're managed in the `GlobalHints` component, which is rendered in the root layout (`app/layout.tsx`).

**Examples:**
- Navigation bar hints (pointing to nav links)
- "Did You Know" hints (fixed position in lower right corner, no arrow)

**Implementation:**
```tsx
// In app/layout.tsx
<GlobalHints
  tutorialData={tutorialData}
  userId={session?.user?.id}
/>
```

### Page-Specific Hints

Page-specific hints appear only on particular pages (e.g., `"profile"`, `"prompt"`, `"portfolio"`). These are useful for features that are unique to a specific page.

**Implementation:**
```tsx
import { HintPopover } from "@/components/hint-popover";
import { TutorialManager } from "@/lib/tutorial-manager";

export default async function YourPage() {
  const session = await auth();
  let tutorialManager: TutorialManager | null = null;
  
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tutorial: true },
    });
    tutorialManager = new TutorialManager(user?.tutorial);
  }

  const shouldShowHint = tutorialManager && 
    !tutorialManager.isHintSeen("yourPage", "yourHintKey");

  return (
    <>
      {/* Your page content */}
      
      {shouldShowHint && (
        <HintPopover
          hintKey="yourHintKey"
          page="yourPage"
          title={t("yourHintTitle")}
          description={t("yourHintDescription")}
          targetSelector="a[href='/your-page']"
          side="bottom"
          shouldShow={true}
          order={1}
        />
      )}
    </>
  );
}
```

## Positioning

### Target-Based Hints

Target-based hints use a CSS selector to point to a specific element on the page. The arrow automatically positions itself relative to the target.

**Configuration:**
```tsx
{
  key: "exhibits",
  order: 1,
  title: t("exhibitHintTitle"),
  description: t("exhibitHintDescription"),
  targetSelector: "a[href='/exhibition']", // CSS selector
  side: "bottom", // "top" | "right" | "bottom" | "left"
  showArrow: true,
}
```

**Features:**
- Automatically positions relative to target element
- Arrow points to the target with 12px gap
- Updates position on scroll, resize, and DOM changes
- Falls back to fixed position if target not found or not visible

### Fixed-Position Hints

Fixed-position hints appear at a specific location on the screen, typically for "Did You Know" style tips.

**Configuration:**
```tsx
{
  key: "didYouKnow1",
  order: 3,
  title: t("didYouKnow1Title"),
  description: t("didYouKnow1Description"),
  fixedPosition: { bottom: 24, right: 24 }, // Fixed position
  showArrow: false, // No arrow for fixed hints
}
```

**Common Positions:**
- Lower right: `{ bottom: 24, right: 24 }`
- Lower left: `{ bottom: 24, left: 24 }`
- Upper right: `{ top: 24, right: 24 }`
- Upper left: `{ top: 24, left: 24 }`

## User Flow

1. **New Users**: When a user first signs up, their profile gets a `tutorial` JSON blob initialized with `status: "enabled"` and empty hint objects
2. **Hint Display**: On pages where hints exist, logged-in users see hints for features they haven't been introduced to
3. **Sequential Display**: Hints are shown one at a time, ordered by their `order` field (lower numbers first)
4. **Dismissal**: Users can dismiss hints by clicking "Got it" or the X button
5. **Persistence**: Once dismissed, hints are marked as seen and never shown again for that user
6. **Flexibility**: New hints can be added in the future, and old hints can be removed without breaking the system

## API

### POST `/api/tutorial`

Marks a hint as seen and updates the user's tutorial data.

**Request Body:**
```json
{
  "page": "global",
  "hintKey": "exhibits",
  "order": 1
}
```

**Response:**
```json
{
  "success": true,
  "tutorial": { ... updated tutorial blob ... }
}
```

**Usage:**
The `HintPopover` component automatically calls this endpoint when a hint is dismissed.

### PATCH `/api/tutorial`

Controls the global tutorial status.

**Request Body:**
```json
{
  "action": "enable" | "disable" | "reset"
}
```

**Actions:**
- `enable` - Enable all tutorials
- `disable` - Disable all tutorials (hints won't show)
- `reset` - Reset all hints to unseen state

## TutorialManager Class

The `TutorialManager` class manages hint state and provides utility methods.

### Initialization

```typescript
import { TutorialManager } from "@/lib/tutorial-manager";

const tutorialManager = new TutorialManager(user?.tutorial);
```

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `isHintSeen()` | `(page: string, hintKey: string)` | `boolean` | Check if hint has been dismissed |
| `markHintSeen()` | `(page: string, hintKey: string, order?: number)` | `void` | Mark hint as seen and save timestamp |
| `isEnabled()` | - | `boolean` | Check if tutorials are globally enabled |
| `enable()` | - | `void` | Enable all tutorials |
| `disable()` | - | `void` | Disable all tutorials |
| `reset()` | - | `void` | Reset tutorial data to default state |
| `toJSON()` | - | `TutorialBlob` | Get updated JSON blob for database |
| `getHintMetadata()` | `(page: string)` | `Array<{key, order, seen, dismissedAt}>` | Get all hints for a page |
| `hasUnseenHints()` | `(page: string)` | `boolean` | Check if page has any unseen hints |
| `getNextHint()` | `(page: string, availableHints: Array<{key, order}>)` | `string \| null` | Get the next hint to show based on order and seen status |

### Example Usage

```typescript
const tutorialManager = new TutorialManager(user?.tutorial);

// Check if a hint has been seen
if (!tutorialManager.isHintSeen("profile", "portfolio")) {
  // Show hint
}

// Get the next hint to show
const nextHintKey = tutorialManager.getNextHint("global", [
  { key: "exhibits", order: 1 },
  { key: "creators", order: 2 },
]);
```

## Adding New Hints

### Step 1: Add Translations

Add hint title and description to `messages/en.json` and `messages/es.json`:

**For global hints:**
```json
{
  "global": {
    "yourHintTitle": "Hint Title",
    "yourHintDescription": "A brief description explaining what the feature does."
  }
}
```

**For page-specific hints:**
```json
{
  "yourPage": {
    "yourHintTitle": "Hint Title",
    "yourHintDescription": "A brief description explaining what the feature does."
  }
}
```

### Step 2: Add the Hint Component

#### Global Hints

Add your hint configuration to the `availableHints` array in `components/global-hints.tsx`:

```tsx
const availableHints: GlobalHint[] = [
  // ... existing hints
  {
    key: "yourGlobalHint",
    order: 3,
    title: t("yourHintTitle"),
    description: t("yourHintDescription"),
    targetSelector: "a[href='/your-page']", // For target-based hints
    side: "bottom",
    showArrow: true,
  },
  // Or for "Did You Know" style hints:
  {
    key: "didYouKnow1",
    order: 4,
    title: t("didYouKnow1Title"),
    description: t("didYouKnow1Description"),
    fixedPosition: { bottom: 24, right: 24 },
    showArrow: false,
  },
];
```

#### Page-Specific Hints

Use the `HintPopover` component directly in your page:

```tsx
import { HintPopover } from "@/components/hint-popover";
import { TutorialManager } from "@/lib/tutorial-manager";

export default async function YourPage() {
  const session = await auth();
  const t = await getTranslations("yourPage");
  
  let tutorialManager: TutorialManager | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tutorial: true },
    });
    tutorialManager = new TutorialManager(user?.tutorial);
  }

  const shouldShowHint = tutorialManager && 
    !tutorialManager.isHintSeen("yourPage", "yourHintKey");

  return (
    <>
      {/* Your page content */}
      
      {shouldShowHint && (
        <HintPopover
          hintKey="yourHintKey"
          page="yourPage"
          title={t("yourHintTitle")}
          description={t("yourHintDescription")}
          targetSelector="a[href='/your-page']"
          side="bottom"
          shouldShow={true}
          order={1}
        />
      )}
    </>
  );
}
```

### Step 3: Test

1. Verify hints appear for new users
2. Verify hints don't reappear after dismissal
3. Test on both desktop and mobile views
4. Verify target selectors work correctly

## HintPopover Component

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `hintKey` | `string` | ✓ | Unique identifier for this hint (used in tracking) |
| `page` | `string` | ✓ | Page identifier where hint appears (e.g., `"global"`, `"prompt"`) |
| `title` | `string` | ✓ | Hint title shown to the user |
| `description` | `string` | ✓ | Hint description/explanation |
| `targetSelector` | `string` | - | CSS selector for the element the arrow points to (required for target-based hints) |
| `side` | `"top" \| "right" \| "bottom" \| "left"` | - | Arrow direction (default: `"bottom"`, only used with `targetSelector`) |
| `shouldShow` | `boolean` | ✓ | Whether to render the hint (usually controlled by tutorial state) |
| `order` | `number` | - | Display order for prioritization |
| `showArrow` | `boolean` | - | Whether to show the arrow pointing to target (default: `true`) |
| `fixedPosition` | `{ bottom?, right?, top?, left? }` | - | Fixed position for hints without targets (e.g., "Did You Know" hints) |

### Behavior

- **Target Detection**: Automatically finds and positions relative to the target element
- **Visibility Check**: Only shows if target element is visible (not hidden via CSS)
- **Position Updates**: Updates position on scroll, resize, and DOM changes
- **Fallback**: Falls back to fixed position if target not found after retries
- **Dismissal**: Calls `/api/tutorial` to mark hint as seen, then refreshes page

## Styling

Hints use the shadcn theme system and automatically adapt to light/dark mode:

- **Border**: `border-border`
- **Background**: `bg-popover`
- **Text**: `text-popover-foreground`
- **Arrow**: Matches popover background color (only shown when `showArrow={true}`)

For target-based hints, the arrow is a CSS triangle pointing toward the target element with a 12px gap for visual separation.

For fixed-position hints (like "Did You Know"), no arrow is shown (`showArrow={false}`) and the hint appears at a fixed position on the screen.

## Best Practices

1. **Keep Hints Concise**: Title should be 2-4 words, description 1-2 sentences
2. **Choose the Right Type**: Use global hints for navigation and universal features, page-specific hints for unique page features
3. **Point Accurately**: Use specific CSS selectors that uniquely target the feature (for target-based hints)
4. **Smart Positioning**: 
   - Use `side="bottom"` for nav items
   - Use `fixedPosition={{ bottom: 24, right: 24 }}` for "Did You Know" style hints
   - Adjust based on available space
5. **Hint Order**: Set `order` field when marking hints as seen for future prioritization
6. **Test Both States**: Verify hints appear for new users and don't reappear after dismissal
7. **Mobile Friendly**: Ensure target selectors work on both desktop and mobile views
8. **One at a Time**: Global hints show one at a time based on order - ensure proper ordering
9. **Internationalization**: Always use translation keys for hint text, never hardcode strings

## Examples

### Example: Global Navigation Hints

The system includes global hints that appear on all pages:

**1. Exhibits Hint**
- Type: Target-based (points to nav link)
- Targets: `a[href='/exhibition']` (Exhibits nav link)
- Shows when: User is logged in and hasn't dismissed it
- Location: `components/global-hints.tsx`

**2. Creators Hint**
- Type: Target-based (points to nav link)
- Targets: `a[href='/creators']` (Creators nav link)
- Shows when: User is logged in and hasn't dismissed it
- Location: `components/global-hints.tsx`

**3. "Did You Know" Hints**
- Type: Fixed position (no arrow)
- Position: Lower right corner (`{ bottom: 24, right: 24 }`)
- Shows when: User is logged in and hasn't dismissed it
- Location: `components/global-hints.tsx`

All global hints are rendered conditionally based on the user's tutorial state and automatically save dismissal to the database via the API endpoint. They appear one at a time, ordered by priority.

### Example: Profile Page Hints

The profile page includes hints for portfolio management:

```tsx
// In app/profile/[userId]/page.tsx
const availableHints = [
  {
    key: "portfolio",
    order: 1,
    title: t("portfolioHintTitle"),
    description: t("portfolioHintDescription"),
    targetSelector: "a[href='/portfolio/edit']",
    side: "bottom" as const,
    showArrow: true,
  },
];

const nextHintKey = tutorialManager.getNextHint(
  "profile",
  availableHints.map((h) => ({ key: h.key, order: h.order })),
);
```

## Troubleshooting

### Hint Not Appearing

1. Check if user is logged in (hints only show for authenticated users)
2. Verify tutorial status is `"enabled"` in the user's tutorial blob
3. Check if hint has already been marked as seen
4. Verify target selector matches an element on the page (for target-based hints)
5. Check browser console for warnings about target element not found

### Hint Position Issues

1. For target-based hints, ensure the target element is visible (not hidden via CSS)
2. Check that the target selector is unique and matches the intended element
3. Verify the target element exists in the DOM when the hint renders
4. For fixed-position hints, adjust the position values if needed

### Hint Not Dismissing

1. Check browser console for API errors
2. Verify the `/api/tutorial` endpoint is accessible
3. Check that the user is authenticated
4. Verify the page refresh happens after dismissal

## Future Enhancements

- Add hint progress tracking (e.g., "2 of 5 hints completed")
- Implement hint replay for users who want to see them again
- Add analytics to track which hints are most helpful
- Create guided tours combining multiple hints in sequence
- Add skip tutorial option to disable all hints at once
- Support for hint scheduling (show hints after user performs certain actions)
