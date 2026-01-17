# Help & Hints System

## Overview

The Hints system provides contextual guidance to users within the app. Hints are non-intrusive popovers that guide users to important features. They can appear with pointed arrows pointing to specific elements, or as fixed-position hints (like "Did You Know" tips) in the corner of the screen. They're shown once per session and can be dismissed or automatically marked as seen when viewed.

## Hint Types

### Page-Specific Hints

Page-specific hints appear only on particular pages (e.g., "prompt", "portfolio"). These are useful for features that are unique to a specific page.

### Global Hints

Global hints can appear on any page and are typically tied to global elements like navigation items. They're managed in the `GlobalHints` component which is rendered in the root layout. Examples include:
- Navigation bar hints (pointing to nav links)
- "Did You Know" hints (fixed position in lower right corner, no arrow)

## How It Works

### User Journey

1. **New Users**: When a user first signs up, their profile gets a `tutorial` JSON blob initialized with all hints marked as "unseen"
2. **Hint Display**: On pages where hints exist, logged-in users see hints for features they haven't been introduced to
3. **Dismissal**: Users can dismiss hints by clicking "Got it" or the X button
4. **Persistence**: Once dismissed, hints are marked as seen and never shown again for that user
5. **Flexibility**: New hints can be added in the future, and old hints can be removed without breaking the system

### Data Structure

The `tutorial` field on the User model stores a JSON blob that tracks hint state:

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
      "seen": false,
      "dismissedAt": null
    }
  },
  "prompt": {
    "yourHintKey": {
      "order": 1,
      "seen": false,
      "dismissedAt": null
    }
  }
}
```

- **status**: "enabled" | "disabled" - Controls whether tutorials show globally
- **global**: Global hints that can appear on any page (e.g., nav bar hints, "Did You Know" tips)
- **[page]**: Page-specific hints (e.g., "prompt", "portfolio")
- **[hintKey]**: Unique identifier for the hint (e.g., "exhibits", "creators")
  - **order**: Display order for hints on that page (useful for prioritization)
  - **seen**: Boolean indicating if the user has dismissed this hint
  - **dismissedAt**: ISO timestamp of when the hint was dismissed

## Usage

### Adding a New Hint

#### 1. Update Translations

Add hint title and description to `messages/en.json` and `messages/es.json`:

For **global hints** (appear on all pages):
```json
{
  "global": {
    "yourHintTitle": "Hint Title",
    "yourHintDescription": "A brief description explaining what the feature does."
  }
}
```

For **page-specific hints**:
```json
{
  "yourPage": {
    "yourHintTitle": "Hint Title",
    "yourHintDescription": "A brief description explaining what the feature does."
  }
}
```

#### 2. Add the Hint Component

**For Global Hints:**

Global hints are managed in `components/global-hints.tsx`. Add your hint configuration to the `availableHints` array:

```tsx
// In components/global-hints.tsx
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
    fixedPosition: { bottom: 24, right: 24 }, // Lower right corner
    showArrow: false,
  },
];
```

**For Page-Specific Hints:**

Use the `HintPopover` component directly in your page:

```tsx
import { HintPopover } from "@/components/hint-popover";

export default function YourPage() {
  const session = await auth();
  let tutorialManager: TutorialManager | null = null;
  
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tutorial: true },
    });
    tutorialManager = new TutorialManager(user?.tutorial);
  }

  return (
    <>
      {/* Your page content */}
      
      {session?.user && tutorialManager && (
        {!tutorialManager.isHintSeen("yourPage", "yourHintKey") && (
          <HintPopover
            hintKey="yourHintKey"
            page="yourPage"
            title={t("yourHintTitle")}
            description={t("yourHintDescription")}
            targetSelector="a[href='/your-page']"
            side="bottom"
            shouldShow={true}
          />
        )}
      )}
    </>
  );
}
```

### HintPopover Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `hintKey` | string | ✓ | Unique identifier for this hint (used in tracking) |
| `page` | string | ✓ | Page identifier where hint appears (e.g., "global", "prompt") |
| `title` | string | ✓ | Hint title shown to the user |
| `description` | string | ✓ | Hint description/explanation |
| `targetSelector` | string | - | CSS selector for the element the arrow points to (required for target-based hints) |
| `side` | "top" \| "right" \| "bottom" \| "left" | - | Arrow direction (default: "bottom", only used with targetSelector) |
| `shouldShow` | boolean | ✓ | Whether to render the hint (usually controlled by tutorial state) |
| `order` | number | - | Display order for prioritization |
| `showArrow` | boolean | - | Whether to show the arrow pointing to target (default: true) |
| `fixedPosition` | `{ bottom?, right?, top?, left? }` | - | Fixed position for hints without targets (e.g., "Did You Know" hints) |

### TutorialManager Class

The `TutorialManager` class manages hint state. Initialize it with user tutorial data:

```typescript
import { TutorialManager } from "@/lib/tutorial-manager";

const tutorialManager = new TutorialManager(user?.tutorial);
```

#### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `isHintSeen()` | `(page: string, hintKey: string)` | `boolean` | Check if hint has been dismissed |
| `markHintSeen()` | `(page: string, hintKey: string, order?: number)` | `void` | Mark hint as seen and save timestamp |
| `isEnabled()` | - | `boolean` | Check if tutorials are globally enabled |
| `disable()` | - | `void` | Disable all tutorials |
| `toJSON()` | - | `TutorialBlob` | Get updated JSON blob for database |
| `getHintMetadata()` | `(page: string)` | `Array<{key, order, seen, dismissedAt}>` | Get all hints for a page |
| `hasUnseenHints()` | `(page: string)` | `boolean` | Check if page has any unseen hints |

### API Endpoint

**POST** `/api/tutorial`

Marks a hint as seen and updates the user's tutorial data.

**Request Body:**
```json
{
  "page": "home",
  "hintKey": "exhibits"
}
```

**Response:**
```json
{
  "success": true,
  "tutorial": { ... updated tutorial blob ... }
}
```

## Examples

### Example: Global Navigation Hints

The system includes global hints that appear on all pages:

**1. Exhibits Hint**
- Type: Target-based (points to nav link)
- Targets: `a[href='/exhibition']` (Exhibits nav link)
- Shows when: User is logged in and hasn't dismissed it
- Explains: What exhibits are and how to explore them
- Location: Global hints component (rendered in root layout)

**2. Creators Hint**
- Type: Target-based (points to nav link)
- Targets: `a[href='/creators']` (Creators nav link)
- Shows when: User is logged in and hasn't dismissed it
- Explains: How to follow creators and stay updated
- Location: Global hints component (rendered in root layout)

**3. "Did You Know" Hints (Example)**
- Type: Fixed position (no arrow)
- Position: Lower right corner (`{ bottom: 24, right: 24 }`)
- Shows when: User is logged in and hasn't dismissed it
- Explains: Tips and helpful information
- Location: Global hints component (rendered in root layout)

All global hints are rendered conditionally based on the user's tutorial state and automatically save dismissal to the database via the API endpoint. They appear one at a time, ordered by priority.

## Styling

Hints use the shadcn theme system:
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

## Future Enhancements

- Add hint progress tracking (e.g., "2 of 5 hints completed")
- Implement hint replay for users who want to see them again
- Add analytics to track which hints are most helpful
- Create guided tours combining multiple hints in sequence
- Add skip tutorial option to disable all hints at once
