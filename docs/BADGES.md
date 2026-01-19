# Badge System Documentation

## Overview

The Prompts app includes a badge system that recognizes and celebrates user achievements. Badges are automatically awarded when users reach certain milestones in their creative journey, such as submitting their first portfolio item or receiving their first critique. Badges appear on user profiles and users receive email notifications when they earn new badges.

## Architecture

### Components

#### 1. **Database Schema**
- **BadgeAward Table**: Tracks all badge awards to users
  - `id`: Unique identifier
  - `userId`: Foreign key to User
  - `badgeKey`: String identifier for the badge type (e.g., "first_portfolio_submission")
  - `awardedAt`: Timestamp when badge was awarded (defaults to now)
  - `notifiedAt`: Timestamp when notification email was sent (nullable)
  - Unique constraint on `(userId, badgeKey)` to prevent duplicate awards
  - Indexes on `userId` and `awardedAt` for efficient queries

#### 2. **Badge Definitions**
- **Location**: `lib/badges.ts`
- **Type**: TypeScript module exporting badge configuration
- **Structure**: Each badge has:
  - `key`: Unique string identifier (typed as `BadgeKey`)
  - `name`: Display name (e.g., "Aspiring Creator")
  - `description`: Short description (e.g., "First Portfolio Submission")
  - `image`: Path to badge image in `/public/badges/` (e.g., "/badges/first_portfolio_submission.png")
  - `isEligible`: Async function that checks if a user is eligible for the badge

#### 3. **Awarding Workflow**
- **Location**: `app/workflows/check-badge-awards.ts`
- **Type**: Qwik workflow with step-based execution
- **Trigger**: Daily cron job via `app/api/cron/notifications/route.ts`
- **Process**:
  1. Fetch all users
  2. For each user and each badge:
     - Check if badge already awarded
     - Check if user is eligible
     - Award badge if eligible
     - Send notification email
     - Add delay to respect rate limits (500ms between emails)
  3. Return summary with awarded count and errors

#### 4. **Email Notification**
- **Location**: `lib/notifications/badges.ts`
- **Function**: `sendBadgeAwardEmail()`
- **Process**:
  1. Fetch badge definition by key
  2. Check user email preferences (`emailOnBadgeAward`)
  3. Render localized email template
  4. Send email via Resend
  5. Update `BadgeAward.notifiedAt`
  6. Create `NotificationLog` entry

#### 5. **Email Template**
- **Location**: `emails/templates/badge-award-email.tsx`
- **Framework**: React Email
- **Features**:
  - Displays badge image (centered)
  - Shows badge name and description (centered)
  - Link to user's profile
  - Localized content (English and Spanish)
  - Responsive design with email-safe HTML

#### 6. **Profile Display**
- **Location**: `components/profile-badges.tsx`
- **Type**: Client component
- **Features**:
  - Displays badges in a horizontal flex layout
  - Shows badge images (48-56px)
  - Tooltip on hover shows badge name and description
  - Responsive design
  - Theme-aware styling

## Flow Diagram

```
Cron Job Triggered (Daily)
    ↓
Workflow: checkBadgeAwards
    ↓
Fetch All Users
    ↓
For Each User:
    For Each Badge:
        ├─ Check if already awarded
        │   ├─ If Yes: Skip
        │   └─ If No: Continue
        ↓
        Check Eligibility (isEligible function)
        ├─ If Not Eligible: Skip
        └─ If Eligible: Continue
        ↓
        Award Badge (create BadgeAward record)
        ↓
        Send Notification Email
        ├─ Check user email preference (emailOnBadgeAward)
        ├─ Render localized email template
        ├─ Send via Resend
        ├─ Update BadgeAward.notifiedAt
        └─ Create NotificationLog entry
        ↓
        Delay 500ms (rate limiting)
    ↓
Return Results (awardedCount, errors)
```

## Badge Definition Structure

Each badge is defined in `lib/badges.ts` with the following structure:

```typescript
export interface BadgeDefinition {
  key: BadgeKey;  // Unique identifier
  name: string;   // Display name
  description: string;  // Short description
  image: string;  // Path to image in /public/badges/
  isEligible: (userId: string, prisma: PrismaClient) => Promise<boolean>;
}
```

### Example Badge Definition

```typescript
{
  key: "first_portfolio_submission",
  name: "Aspiring Creator",
  description: "First Portfolio Submission",
  image: "/badges/first_portfolio_submission.png",
  isEligible: async (userId, prisma) => {
    const count = await prisma.submission.count({
      where: { userId, isPortfolio: true },
      take: 1,
    });
    return count > 0;
  },
}
```

## Current Badges

| Badge Key | Name | Description | Eligibility Check |
|-----------|------|-------------|-------------------|
| `first_portfolio_submission` | Aspiring Creator | First Portfolio Submission | Has at least one submission with `isPortfolio = true` |
| `first_prompt_submission` | Prompt Pioneer | First Prompt Submission | Has at least one submission with `promptId` not null |
| `first_critique_received` | Featured Voice | First Critique Received | Has at least one critique on their submissions |
| `first_critique_given` | Artful Eye | First Critique Given | Has written at least one critique |

## How to Add a New Badge Type

### Step 1: Update Badge Key Type

In `lib/badges.ts`, add the new badge key to the `BadgeKey` type:

```typescript
export type BadgeKey =
  | "first_portfolio_submission"
  | "first_prompt_submission"
  | "first_critique_received"
  | "first_critique_given"
  | "your_new_badge_key";  // Add your new badge key
```

### Step 2: Create Eligibility Function

Create an async function that checks if a user is eligible for the badge:

```typescript
const hasYourNewBadge = async (
  userId: string,
  prisma: PrismaClient,
): Promise<boolean> => {
  // Your eligibility logic here
  // Return true if user is eligible, false otherwise
  const count = await prisma.someModel.count({
    where: { userId, /* your conditions */ },
    take: 1,
  });
  return count > 0;
};
```

### Step 3: Add Badge Definition

Add your badge to the `badgeDefinitions` array:

```typescript
export const badgeDefinitions: BadgeDefinition[] = [
  // ... existing badges
  {
    key: "your_new_badge_key",
    name: "Your Badge Name",
    description: "Your Badge Description",
    image: "/badges/your_new_badge_key.png",
    isEligible: hasYourNewBadge,
  },
];
```

### Step 4: Create Badge Image

Create a badge image file:
- **Location**: `public/badges/your_new_badge_key.png`
- **Recommended size**: 256x256 pixels
- **Format**: PNG with transparency support
- **Style**: Should match the visual style of existing badges

### Step 5: Add Translations

Add badge name and description translations to `messages/en.json` and `messages/es.json`:

**English** (`messages/en.json`):
```json
{
  "badgeAward": {
    "yourNewBadgeKey": "Your Badge Name",
    "yourNewBadgeKeyDescription": "Your Badge Description"
  }
}
```

**Spanish** (`messages/es.json`):
```json
{
  "badgeAward": {
    "yourNewBadgeKey": "Tu Nombre de Insignia",
    "yourNewBadgeKeyDescription": "Tu Descripción de Insignia"
  }
}
```

### Step 6: Update Translation Helper (if needed)

If your badge key doesn't follow the naming pattern, update the `getBadgeTranslationKey` function in:
- `components/profile-badges.tsx`
- `app/about/badges/page.tsx`

Add a case for your badge key:

```typescript
const getBadgeTranslationKey = (badgeKey: string): string => {
  switch (badgeKey) {
    // ... existing cases
    case "your_new_badge_key":
      return "yourNewBadgeKey";
    default:
      return badgeKey;
  }
};
```

### Step 7: Update "How to Earn" Documentation

Update `app/about/badges/page.tsx` to add the "how to earn" description:

```typescript
const getHowToEarnKey = (badgeKey: string): string => {
  switch (badgeKey) {
    // ... existing cases
    case "your_new_badge_key":
      return "howToEarnYourNewBadge";
    default:
      return "howToEarn";
  }
};
```

Add the translation to `messages/en.json` and `messages/es.json`:

```json
{
  "aboutBadges": {
    "howToEarnYourNewBadge": "Description of how to earn this badge"
  }
}
```

## Badge Eligibility Functions

Eligibility functions should:
- Be async and return `Promise<boolean>`
- Accept `userId: string` and `prisma: PrismaClient` parameters
- Use efficient database queries (prefer `count` with `take: 1` over `findMany`)
- Return `true` if the user meets the criteria, `false` otherwise

### Example Eligibility Patterns

**Count-based check** (most common):
```typescript
const hasSomething = async (userId: string, prisma: PrismaClient) => {
  const count = await prisma.model.count({
    where: { userId, /* conditions */ },
    take: 1,
  });
  return count > 0;
};
```

**Existence check**:
```typescript
const hasSomething = async (userId: string, prisma: PrismaClient) => {
  const exists = await prisma.model.findFirst({
    where: { userId, /* conditions */ },
    select: { id: true },
  });
  return !!exists;
};
```

**Complex query**:
```typescript
const hasSomething = async (userId: string, prisma: PrismaClient) => {
  const result = await prisma.model.findFirst({
    where: {
      userId,
      field1: { gte: someValue },
      field2: { in: ["value1", "value2"] },
      relation: {
        some: { condition: true },
      },
    },
  });
  return !!result;
};
```

## Cron Integration

Badge checking is integrated into the daily cron job at `app/api/cron/notifications/route.ts`:

```typescript
// Check and award badges
checkBadgeAwards({})
  .then((result) => {
    console.log(
      "[Cron] Badge award check workflow completed. Awarded:",
      result.awardedCount,
      "Errors:",
      result.errors.length,
    );
  })
  .catch((error) => {
    console.error("[Cron] Badge award check workflow failed:", error);
  });
```

The workflow runs asynchronously (fire-and-forget) to avoid blocking the cron response.

## Rate Limiting

The badge workflow includes a 500ms delay between email sends to respect Resend's rate limit of 2 requests per second:

```typescript
// Add delay between email sends to avoid rate limiting
// Resend rate limit: 2 requests per second = 500ms minimum delay
await new Promise((resolve) => setTimeout(resolve, 500));
```

## User Preferences

Users can control badge email notifications via their profile settings:
- **Setting**: `emailOnBadgeAward` (default: `true`)
- **Location**: Profile Edit page → Email Preferences section
- **Effect**: If disabled, badge is still awarded but no email is sent

## Internationalization

### Badge Names and Descriptions

Badge names and descriptions are stored in translation files:
- `messages/en.json` under `badgeAward` namespace
- `messages/es.json` under `badgeAward` namespace

### Email Translations

Email-specific translations are in the `email.badgeAward` namespace:
- Subject line
- Title
- Preview text
- Button text

### Translation Keys

Badge translation keys follow this pattern:
- Name: `badgeAward.{badgeKey}` (e.g., `badgeAward.aspiringCreator`)
- Description: `badgeAward.{badgeKey}Description` (e.g., `badgeAward.aspiringCreatorDescription`)

The `getBadgeTranslationKey` helper maps badge keys to translation keys.

## Profile Display

Badges are displayed on user profile pages:
- **Component**: `components/profile-badges.tsx`
- **Location**: After bio, before portfolio section
- **Layout**: Horizontal flex with centered badges
- **Interaction**: Hover tooltip shows badge name and description
- **Styling**: Compact design with muted background

## Database Queries

### Check if user has a badge
```typescript
const hasBadge = await prisma.badgeAward.findFirst({
  where: {
    userId: "user-123",
    badgeKey: "first_portfolio_submission",
  },
});
```

### Get all badges for a user
```typescript
const badges = await prisma.badgeAward.findMany({
  where: { userId: "user-123" },
  orderBy: { awardedAt: "desc" },
});
```

### Get badge statistics
```typescript
const stats = await prisma.badgeAward.groupBy({
  by: ["badgeKey"],
  _count: true,
});
```

## Error Handling

### Workflow Errors
- Badge award failures are caught and logged
- Email send failures are caught and logged separately
- Errors are collected and returned in the workflow response
- Failures for one user/badge don't prevent processing others

### Email Errors
- Detailed error logging includes Resend error metadata
- Rate limit errors are logged with full details
- Notification log creation failures don't fail the operation

## Testing

### Manual Testing
1. Create a test user account
2. Perform the action that should trigger a badge (e.g., add portfolio item)
3. Trigger the cron endpoint or manually call `checkBadgeAwards({})`
4. Verify badge appears on user profile
5. Verify email was sent (if `emailOnBadgeAward` is enabled)
6. Check `BadgeAward` table for the award record
7. Check `NotificationLog` for the notification entry

### Testing Eligibility Functions
```typescript
import { prisma } from "@/lib/prisma";
import { badgeDefinitions } from "@/lib/badges";

const badge = badgeDefinitions.find(b => b.key === "your_badge_key");
if (badge) {
  const eligible = await badge.isEligible("user-id", prisma);
  console.log("Eligible:", eligible);
}
```

## Monitoring

### Key Metrics to Track
- Badges awarded per day/week
- Badge distribution by type
- Email delivery success rate
- User opt-in rate for badge emails
- Most common badges earned

### Logging
- All workflow steps log with `[Workflow]` prefix
- Badge notification logs with `[BadgeAwards]` prefix
- Includes timestamps and contextual information
- Errors logged with full details including Resend metadata

## Troubleshooting

### Badges not being awarded
1. Check cron job is running (`app/api/cron/notifications/route.ts`)
2. Verify workflow is being called
3. Check eligibility function logic
4. Review logs for specific errors
5. Ensure `BadgeAward` table exists

### Emails not sending
1. Check user's `emailOnBadgeAward` preference
2. Verify user has an email address
3. Check Resend configuration
4. Review rate limiting (should see 500ms delays)
5. Check error logs for Resend API errors

### Badge not appearing on profile
1. Verify `BadgeAward` record exists in database
2. Check profile page query includes `badgeAwards`
3. Verify badge image exists in `public/badges/`
4. Check browser console for image loading errors

### Translation issues
1. Verify translation keys exist in `messages/en.json` and `messages/es.json`
2. Check `getBadgeTranslationKey` function includes your badge key
3. Verify translation namespace is correct (`badgeAward`)

## Best Practices

### Eligibility Functions
- Keep eligibility checks simple and efficient
- Use `count` with `take: 1` for existence checks
- Avoid complex joins when possible
- Consider caching for expensive checks

### Badge Keys
- Use snake_case for badge keys
- Make keys descriptive (e.g., `first_portfolio_submission`)
- Keep keys consistent with existing patterns

### Badge Images
- Use consistent sizing (256x256 recommended)
- Maintain visual style consistency
- Optimize file size for web
- Use PNG format with transparency

### Performance
- Badge checking runs daily, not in real-time
- Eligibility checks should be fast (< 100ms)
- Consider batching or optimizing for large user bases
- Rate limiting delays prevent API throttling

## Future Enhancements

### Possible Improvements
1. **Real-time Badge Awards**: Award badges immediately when criteria are met
2. **Badge Categories**: Group badges by type (submission, engagement, etc.)
3. **Badge Rarity**: Track and display badge rarity/rarity levels
4. **Badge Progress**: Show progress toward earning a badge
5. **Badge Collections**: Allow users to view all available badges
6. **Badge Sharing**: Share badge achievements on social media
7. **Badge Analytics**: Track which badges are most common/rare

## References

- [Database Documentation](./DATABASE.md)
- [Notification System Documentation](./NOTIFICATIONS.md)
- [Internationalization Documentation](./INTERNATIONALIZATION.md)
- Workflow Engine: Qwik Workflows
- Email Framework: React Email
