# Help & Hints System

## Overview

The Hints system provides contextual guidance to users within the app. Hints are non-intrusive popovers with pointed arrows that guide users to important features. They're shown once per session and can be dismissed or automatically marked as seen when viewed.

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
  "home": {
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
  }
}
```

- **status**: "enabled" | "disabled" - Controls whether tutorials show globally
- **[page]**: Page-specific hints (e.g., "home", "prompt", "portfolio")
- **[hintKey]**: Unique identifier for the hint (e.g., "exhibits", "creators")
  - **order**: Display order for hints on that page (useful for prioritization)
  - **seen**: Boolean indicating if the user has dismissed this hint
  - **dismissedAt**: ISO timestamp of when the hint was dismissed

## Usage

### Adding a New Hint

#### 1. Update Translations

Add hint title and description to `messages/en.json` and `messages/es.json`:

```json
{
  "home": {
    "yourHintTitle": "Hint Title",
    "yourHintDescription": "A brief description explaining what the feature does."
  }
}
```

#### 2. Add the Hint Component

Use the `HintPopover` component in your page. The component is a client-side element that points to a target element:

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
        {!tutorialManager.isHintSeen("home", "yourHintKey") && (
          <HintPopover
            hintKey="yourHintKey"
            page="home"
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
| `page` | string | ✓ | Page identifier where hint appears (e.g., "home") |
| `title` | string | ✓ | Hint title shown to the user |
| `description` | string | ✓ | Hint description/explanation |
| `targetSelector` | string | ✓ | CSS selector for the element the arrow points to |
| `side` | "top" \| "right" \| "bottom" \| "left" | - | Arrow direction (default: "bottom") |
| `shouldShow` | boolean | ✓ | Whether to render the hint (usually controlled by tutorial state) |

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

### Example: Exhibits Hint on Home Page

The system includes two built-in hints on the home page:

**1. Exhibits Hint**
- Targets: `a[href='/exhibition']` (Exhibits nav link)
- Shows when: User is logged in and hasn't dismissed it
- Explains: What exhibits are and how to explore them

**2. Creators Hint**
- Targets: `a[href='/creators']` (Creators nav link)
- Shows when: User is logged in and hasn't dismissed it
- Explains: How to follow creators and stay updated

Both hints are rendered conditionally based on the user's tutorial state and automatically save dismissal to the database via the API endpoint.

## Styling

Hints use the shadcn theme system:
- **Border**: `border-border`
- **Background**: `bg-popover`
- **Text**: `text-popover-foreground`
- **Arrow**: Matches popover background color

The arrow is a CSS triangle pointing toward the target element with a 12px gap for visual separation.

## Best Practices

1. **Keep Hints Concise**: Title should be 2-4 words, description 1-2 sentences
2. **Point Accurately**: Use specific CSS selectors that uniquely target the feature
3. **Smart Positioning**: Use `side="bottom"` for nav items, adjust based on available space
4. **Hint Order**: Set `order` field when marking hints as seen for future prioritization
5. **Test Both States**: Verify hints appear for new users and don't reappear after dismissal
6. **Mobile Friendly**: Ensure target selectors work on both desktop and mobile views

## Future Enhancements

- Add hint progress tracking (e.g., "2 of 5 hints completed")
- Implement hint replay for users who want to see them again
- Add analytics to track which hints are most helpful
- Create guided tours combining multiple hints in sequence
- Add skip tutorial option to disable all hints at once
