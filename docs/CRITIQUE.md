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

**Purpose**: Entry point for accessing the critique system on submission pages.

**Props**:
- `submissionId: string`
- `critiquesEnabled: boolean`
- `isOwner: boolean`
- `currentUserId?: string | null`
- `submissionTitle?: string | null`

**Features**:
- Only displays if `critiquesEnabled` is `true`
- Shows badge with unseen critique count for creators
- Opens `CritiqueManagerModal` on click

### CritiqueManagerModal

**Location**: `components/critique-manager-modal.tsx`

**Purpose**: Main interface for managing critiques.

**Props**:
- `isOpen: boolean`
- `onClose: () => void`
- `submissionId: string`
- `isOwner: boolean`
- `submissionTitle?: string | null`
- `onUnseenCountChange?: (count: number) => void`

**Features**:

#### For Creators (`isOwner: true`):
- Displays all critiques for the submission
- Shows critiquer's name and avatar (linked to profile)
- Shows "unseen" or "seen" badges
- Can reply to critiques
- Can edit/delete their own responses
- Can delete any critique on their submission
- Automatically marks all critiques as seen when modal opens
- Updates unseen count badge

#### For Critiquers (`isOwner: false`):
- Displays only their own critiques
- Can add new critiques
- Can edit critiques (only if `seenAt` is `null`)
- Can delete critiques (only if `seenAt` is `null`)
- Edit/delete buttons are disabled with tooltips if critique has been seen
- No name/avatar shown (since all critiques are their own)

**UI Elements**:
- Rich text editor for critique and response input
- Icon-only action buttons (Edit/Delete) positioned to the right on desktop, below on mobile
- Tooltips for disabled buttons explaining why they can't be used
- Separators between critiques
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

1. User views a submission with critiques enabled
2. User clicks "Critique" button
3. `CritiqueManagerModal` opens
4. User clicks "Add Critique" button
5. Rich text editor appears
6. User writes critique and clicks "Save"
7. Critique is created via `POST /api/submissions/[id]/critiques`
8. Email notification is sent to creator (async via Inngest workflow)
9. Modal refreshes to show new critique

### Creator Viewing Critiques

1. Creator views their submission
2. "Critique" button shows badge with unseen count (if any)
3. Creator clicks "Critique" button
4. `CritiqueManagerModal` opens
5. All critiques are automatically marked as seen
6. Creator sees:
   - Critiquer's name and avatar
   - Critique text
   - "Unseen" or "Seen" badge
   - Option to reply
   - Option to delete critique

### Creator Replying to Critique

1. Creator views critique in modal
2. Creator clicks "Reply" button
3. Rich text editor appears
4. Creator writes response and clicks "Save"
5. Response is saved via `PUT /api/critiques/[id]/response`
6. Response appears below critique with "Creator Reply" header
7. Creator can edit or delete response

### Editing a Critique (Critiquer)

1. Critiquer views their critique in modal
2. If `seenAt` is `null`, "Edit" button is enabled
3. Critiquer clicks "Edit" button
4. Rich text editor appears with current critique text
5. Critiquer modifies text and clicks "Save"
6. Critique is updated via `PUT /api/critiques/[id]`
7. If `seenAt` is not `null`, "Edit" button is disabled with tooltip

### Deleting a Critique

**As Critiquer**:
1. Critiquer views their critique
2. If `seenAt` is `null`, "Delete" button is enabled
3. Critiquer clicks "Delete" button
4. Confirmation modal appears
5. On confirm, critique is deleted via `DELETE /api/critiques/[id]`
6. If `seenAt` is not `null`, "Delete" button is disabled with tooltip

**As Creator**:
1. Creator views any critique on their submission
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
- ✅ Creators see all critiques for their submission
- ✅ Critiquers see only their own critiques
- ✅ All users must be authenticated

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

The `CritiqueManagerModal` uses React state to manage:
- Critique list
- Loading states
- Form states (adding, editing, replying)
- Confirmation modals
- Unseen count tracking

### Optimistic Updates

After successful API calls, the component:
- Refreshes the critique list
- Updates local state
- Triggers `router.refresh()` if needed
- Updates unseen count via callback

### Modal Behavior

- Automatically marks all critiques as seen when creator opens modal
- Uses `hasMarkedAsSeen` flag to prevent duplicate API calls
- Fetches critiques on modal open
- Resets state on modal close

## Integration Points

### Submission Pages

**Location**: `app/s/[id]/submission-detail.tsx`

- Displays `CritiqueButton` when `critiquesEnabled` is `true`
- Passes submission data to button component

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
