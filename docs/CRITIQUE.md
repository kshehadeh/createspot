# Critique Feature Documentation

This document describes the critique feature that allows creators to request feedback on their submissions and enables community members to provide constructive critiques.

## Overview

The critique feature enables a feedback loop between creators and the community:

- **Creators** can enable critiques on their submissions and receive feedback from other users
- **Critiquers** can provide detailed feedback using a rich text editor
- **Creators** can respond to critiques, creating a dialogue
- **Email notifications** alert creators when they receive new critiques
- **Permission system** ensures critiques can only be edited/deleted before the creator has seen them

## Database Schema

### Critique Model

The `Critique` model stores all critique data:

```prisma
model Critique {
  id           String    @id @default(cuid())
  submissionId String
  critiquerId  String    // User who wrote the critique
  critique     String    @db.Text // HTML text (from RichTextEditor)
  response     String?   @db.Text // Creator's reply (HTML, nullable)
  seenAt       DateTime? // When creator viewed the critique (NULL = unseen)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  submission Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  critiquer  User      @relation("Critiques", fields: [critiquerId], references: [id], onDelete: Cascade)

  @@index([submissionId])
  @@index([critiquerId])
  @@index([submissionId, critiquerId])
}
```

### Submission Model Addition

The `Submission` model includes a field to enable/disable critiques:

```prisma
model Submission {
  // ... other fields
  critiquesEnabled Boolean @default(false) // Allow critiques on this submission
  critiques        Critique[]
}
```

### User Model Relation

Users can write multiple critiques:

```prisma
model User {
  // ... other fields
  critiques Critique[] @relation("Critiques")
}
```

## API Endpoints

### GET `/api/submissions/[id]/critiques`

Fetches critiques for a submission.

**Authentication**: Required

**Response**:
- If user is the creator: Returns all critiques with critiquer information
- If user is a critiquer: Returns only their own critiques

**Response Format**:
```json
{
  "critiques": [
    {
      "id": "string",
      "critique": "string (HTML)",
      "response": "string | null (HTML)",
      "seenAt": "string | null (ISO date)",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)",
      "critiquer": {
        "id": "string",
        "name": "string | null",
        "image": "string | null"
      }
    }
  ]
}
```

### POST `/api/submissions/[id]/critiques`

Creates a new critique.

**Authentication**: Required

**Request Body**:
```json
{
  "critique": "string (HTML from RichTextEditor)"
}
```

**Validation**:
- Critique text is required and must not be empty
- Submission must exist and have `critiquesEnabled: true`
- User cannot critique their own submission
- Triggers email notification to creator (async)

**Response**: Returns the created critique with critiquer information

### PUT `/api/critiques/[id]`

Updates an existing critique.

**Authentication**: Required

**Request Body**:
```json
{
  "critique": "string (HTML from RichTextEditor)"
}
```

**Permissions**:
- Only the critiquer can update their critique
- Can only be updated if `seenAt` is `null` (unseen by creator)

**Response**: Returns the updated critique

### DELETE `/api/critiques/[id]`

Deletes a critique.

**Authentication**: Required

**Permissions**:
- **Critiquer**: Can delete only if `seenAt` is `null` (unseen)
- **Creator**: Can delete any critique on their submission (no restrictions)

**Response**: `{ "success": true }`

### PUT `/api/critiques/[id]/response`

Adds or updates a creator's response to a critique.

**Authentication**: Required

**Request Body**:
```json
{
  "response": "string (HTML from RichTextEditor)"
}
```

**Permissions**:
- Only the submission owner (creator) can add/update responses

**Response**: Returns the updated critique with response

### DELETE `/api/critiques/[id]/response`

Deletes a creator's response (sets it to `null`).

**Authentication**: Required

**Permissions**:
- Only the submission owner (creator) can delete responses

**Response**: `{ "success": true }`

### POST `/api/critiques/[id]/seen`

Marks a critique as seen by the creator.

**Authentication**: Required

**Permissions**:
- Only the submission owner can mark critiques as seen

**Response**: `{ "success": true }`

**Note**: This endpoint sets `seenAt` to the current timestamp. Once set, critiquers can no longer edit or delete the critique.

## UI Components

### CritiqueButton

**Location**: `components/critique-button.tsx`

**Purpose**: Entry point for accessing the critique system on submission pages. Renders a link to the dedicated critiques page.

**Props**:
- `submissionId: string`
- `critiquesEnabled: boolean`
- `isOwner: boolean`
- `currentUserId?: string | null`
- `submissionTitle?: string | null`
- `user: { id: string; slug?: string | null }` — creator for building the critiques page URL

**Features**:
- Only displays if `critiquesEnabled` is `true` and (creator **or** submission is public)
- Links to `/creators/[creatorid]/s/[submissionid]/critiques`
- Shows badge with unseen critique count for creators

### Critiques Page

**Route**: `/creators/[creatorid]/s/[submissionid]/critiques`

**Location**: `app/creators/[creatorid]/s/[submissionid]/critiques/page.tsx`

**Purpose**: Dedicated page for viewing and managing critiques. Desktop: two columns (critiques list left, submission panel right). Mobile: critiques full width with a "View submission" button that opens the submission in a sheet.

**Access control**:
- **Creator**: Can always access when authenticated.
- **Non-creator**: Can access only if the submission is **public** (`shareStatus === "PUBLIC"`) and **critiques enabled**. Otherwise `notFound()`.
- Unauthenticated users are redirected to sign-in.

### CritiquesPanel

**Location**: `components/critiques-panel.tsx`

**Purpose**: Main interface for the critique list (add, edit, delete, reply). Used on the critiques page.

**Props**:
- `submissionId: string`
- `isOwner: boolean`
- `currentUserId?: string | null`
- `submissionTitle?: string | null`
- `onUnseenCountChange?: (count: number) => void`

**Features**:

Both creators and critiquers see the same collapsible list UI; only the grouping and header differ:

#### For Creators (`isOwner: true`):
- One collapsible group per critiquer; header is the critiquer's name (linked to profile) and an "Unseen" badge when applicable
- Can reply to critiques
- Can edit/delete their own responses
- Can delete any critique on their submission
- Automatically marks all critiques as seen when page loads
- Updates unseen count via callback

#### For Critiquers (`isOwner: false`):
- Single collapsible group titled **"Your Critiques"** containing all of their critiques (same structure as creator view)
- Can add new critiques
- Can edit critiques (only if `seenAt` is `null`)
- Can delete critiques (only if `seenAt` is `null`)

**UI Elements**:
- Collapsible sections with chevron; dotted separators between items within a group
- Rich text editor for critique and response input
- Edit/Delete/Reply action links
- Confirmation modals for deletions

### PortfolioItemForm Integration

**Location**: `components/portfolio-item-form.tsx`

**Feature**: Switch component to enable/disable critiques when creating or editing submissions.

**Translation Keys**:
- `critique.enableCritiques`: "Enable critiques"
- `critique.enableCritiquesDescription`: "Allow others to provide feedback on this work"

## User Flows

### Enabling Critiques

1. User creates or edits a submission via `PortfolioItemForm`
2. User toggles "Enable critiques" switch
3. `critiquesEnabled` field is saved with the submission
4. Submission page displays "Critique" button

### Adding a Critique

1. User views a submission with critiques enabled (and public, if not the creator)
2. User clicks "Critique" button and navigates to the critiques page
3. User clicks "Add Critique" button
4. Rich text editor appears
5. User writes critique and clicks "Save"
6. Critique is created via `POST /api/submissions/[id]/critiques`
7. Email notification is sent to creator (async via Inngest workflow)
8. Page refreshes to show new critique

### Creator Viewing Critiques

1. Creator views their submission
2. "Critique" button shows badge with unseen count (if any)
3. Creator clicks "Critique" button and navigates to the critiques page
4. All critiques are automatically marked as seen
5. Creator sees:
   - Critiques list on the left; submission panel (image above text) on the right (desktop); on mobile, same content in one column (critiques then submission)
   - One collapsible group per critiquer with name (linked to profile) and "Unseen" badge when applicable
   - Critique text and creator reply
   - Option to reply and option to delete critique

### Creator Replying to Critique

1. Creator views critique on the critiques page
2. Creator clicks "Reply" button
3. Rich text editor appears
4. Creator writes response and clicks "Save"
5. Response is saved via `PUT /api/critiques/[id]/response`
6. Response appears below critique with "Creator Reply" header
7. Creator can edit or delete response

### Editing a Critique (Critiquer)

1. Critiquer views their critique on the critiques page
2. If `seenAt` is `null`, "Edit" button is enabled
3. Critiquer clicks "Edit" button
4. Rich text editor appears with current critique text
5. Critiquer modifies text and clicks "Save"
6. Critique is updated via `PUT /api/critiques/[id]`
7. If `seenAt` is not `null`, "Edit" is not shown

### Deleting a Critique

**As Critiquer**:
1. Critiquer views their critique on the critiques page
2. If `seenAt` is `null`, "Delete" button is enabled
3. Critiquer clicks "Delete" button
4. Confirmation modal appears
5. On confirm, critique is deleted via `DELETE /api/critiques/[id]`
6. If `seenAt` is not `null`, "Delete" is not shown

**As Creator**:
1. Creator views any critique on their submission (on the critiques page)
2. Creator clicks "Delete" button
3. Confirmation modal appears
4. On confirm, critique is deleted (no restrictions)

## Permissions and Rules

### Critique Creation
- ✅ User must be authenticated
- ✅ Submission must exist and have `critiquesEnabled: true`
- ✅ User cannot critique their own submission
- ✅ Critique text must not be empty

### Critique Editing
- ✅ Only the critiquer can edit their critique
- ✅ Can only edit if `seenAt` is `null` (unseen by creator)
- ❌ Cannot edit after creator has seen it

### Critique Deletion
- ✅ Critiquer can delete if `seenAt` is `null`
- ✅ Creator can delete any critique on their submission (unrestricted)
- ❌ Critiquer cannot delete after creator has seen it

### Response Management
- ✅ Only the submission owner (creator) can add/edit/delete responses
- ✅ No restrictions on when responses can be modified

### Viewing Critiques
- ✅ Creators see all critiques for their submission (always when authenticated)
- ✅ Critiquers see only their own critiques
- ✅ Non-creators can access the critiques page only if the submission is **public** and **critiques enabled**
- ✅ All users must be authenticated (redirect to sign-in otherwise)

## Email Notifications

### Workflow

**Location**: `app/workflows/send-critique-notification.ts`

**Trigger**: Automatically triggered when a new critique is created via `POST /api/submissions/[id]/critiques`

**Process**:
1. Fetches submission and critiquer data
2. Checks if creator has email notifications enabled (`emailOnFavorite` setting)
3. Prevents self-notification (if critiquer is the creator)
4. Sends email using `CritiqueNotificationEmail` template
5. Uses creator's language preference for translations

### Email Template

**Location**: `emails/templates/critique-notification-email.tsx`

**Content**:
- Critiquer's name
- Submission title (or "your work" if no title)
- Link to view submission
- Link to critiquer's profile
- Translated based on creator's language preference

**Translation Keys** (in `messages/en.json` and `messages/es.json`):
- `critiqueNotification.title`
- `critiqueNotification.message`
- `critiqueNotification.description`
- `critiqueNotification.viewWorkButton`
- `critiqueNotification.visitProfile`
- `critiqueNotification.subject`
- `critiqueNotification.previewText`
- `critiqueNotification.yourWork`
- `critiqueNotification.someone`

## Internationalization

All UI text is internationalized using `next-intl`. Translation keys are located in:
- `messages/en.json` (English)
- `messages/es.json` (Spanish)

### Translation Keys

**Namespace**: `critique`

- `enableCritiques`: "Enable critiques"
- `enableCritiquesDescription`: "Allow others to provide feedback on this work"
- `critiqueButton`: "Critique"
- `manageCritiques`: "Manage Critiques"
- `allCritiques`: "All Critiques"
- `yourCritiques`: "Your Critiques"
- `addCritique`: "Add Critique"
- `editCritique`: "Edit Critique"
- `deleteCritique`: "Delete Critique"
- `reply`: "Reply"
- `creatorReply`: "Creator Reply"
- `editReply`: "Edit Reply"
- `deleteReply`: "Delete Reply"
- `noCritiques`: "No critiques yet"
- `unseen`: "Unseen"
- `seen`: "Seen"
- `cannotEdit`: "Cannot edit after creator has seen this critique"
- `cannotDelete`: "Cannot delete after creator has seen this critique"
- `critiquePlaceholder`: "Write your critique..."
- `responsePlaceholder`: "Write your response..."
- `saving`: "Saving..."
- `deleting`: "Deleting..."
- `critiquer`: "Critiquer"
- `deleteCritiqueConfirm`: "Are you sure you want to delete this critique?"

## Technical Details

### Rich Text Editor

The feature uses the existing `RichTextEditor` component for both critiques and responses. Content is stored as HTML in the database.

### State Management

The `CritiquesPanel` uses React state to manage:
- Critique list
- Loading states
- Form states (adding, editing, replying)
- Confirmation modals
- Unseen count tracking (via callback to parent/CritiqueButton)

### Optimistic Updates

After successful API calls, the component:
- Refreshes the critique list
- Updates local state
- Updates unseen count via callback (for badge on submission page)

### Critiques Page Behavior

- Automatically marks all critiques as seen when creator loads the page
- Uses `hasMarkedAsSeen` flag to prevent duplicate API calls
- Fetches critiques on mount
- Desktop: two columns (critiques left, submission right with image above text)
- Mobile: critiques full width; "View submission" opens a bottom sheet with the submission

## Integration Points

### Submission Pages

**Location**: `components/submission-detail.tsx` (used by `app/creators/[creatorid]/s/[submissionid]/page.tsx`)

- Displays `CritiqueButton` when `critiquesEnabled` is `true` and (user is creator **or** submission is public)
- Passes submission data and `user` to build the link to the critiques page

### Submission API

**Locations**: 
- `app/api/submissions/route.ts` (POST)
- `app/api/submissions/[id]/route.ts` (PUT)

- Accepts `critiquesEnabled` field in create/update operations
- Persists the field with submission data

## Future Enhancements

Potential improvements to consider:

1. **Critique Reactions**: Allow users to react to critiques (helpful, etc.)
2. **Critique Threading**: Support nested replies for deeper discussions
3. **Critique Templates**: Pre-defined critique structures or prompts
4. **Critique Analytics**: Track critique engagement and response rates
5. **Critique Moderation**: Admin tools to review and moderate critiques
6. **Critique Notifications Settings**: Separate email preference for critiques (currently uses `emailOnFavorite`)
7. **Critique Search**: Search functionality within critiques
8. **Critique Export**: Allow creators to export critiques for their records
