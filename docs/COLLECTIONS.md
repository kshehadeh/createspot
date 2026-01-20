# Collections Documentation

## Overview

Collections are user-owned, curated subsets of their portfolio with custom ordering, names, descriptions, and visibility control. Unlike permanent portfolio or admin-curated exhibits, collections provide flexibility for users to organize and share specific groups of their work.

## Key Features

- **User-owned**: Each user can create and manage their own collections
- **Visibility control**: Collections can be private (owner-only) or public (shareable with anyone)
- **Custom ordering**: Each collection has its own independent ordering, separate from portfolio order
- **Reusable**: Submissions can belong to multiple collections
- **Autocomplete search**: Fast, searchable submission selector for adding items

## Database Schema

### Models

#### Collection

```prisma
model Collection {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?  @db.Text
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  submissions CollectionSubmission[]

  @@index([userId])
  @@index([userId, isPublic])
}
```

**Fields:**
- `id`: Unique collection identifier
- `userId`: Owner of the collection
- `name`: Display name for the collection
- `description`: Optional description text
- `isPublic`: Visibility flag (false = private, true = public)
- `createdAt`, `updatedAt`: Timestamps

#### CollectionSubmission

```prisma
model CollectionSubmission {
  id           String   @id @default(cuid())
  collectionId String
  submissionId String
  order        Int
  createdAt    DateTime @default(now())

  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@unique([collectionId, submissionId])
  @@index([collectionId, order])
}
```

**Fields:**
- `id`: Unique junction record identifier
- `collectionId`: Reference to the collection
- `submissionId`: Reference to the submission
- `order`: Custom ordering (lower = first)
- `createdAt`: Timestamp of addition

**Key Behaviors:**
- `@@unique([collectionId, submissionId])`: A submission can only appear once in a collection
- `onDelete: Cascade`: If a submission is deleted, it's removed from all collections
- Deleting a collection does NOT delete the submissions themselves

## API Routes

### GET `/api/collections`

List collections belonging to the current user.

**Query Parameters:**
- `userId` (optional): If provided and different from current user, returns only public collections for that user

**Response:**
```json
{
  "collections": [
    {
      "id": "...",
      "name": "Nature Photography",
      "description": "...",
      "isPublic": true,
      "createdAt": "...",
      "updatedAt": "...",
      "submissions": [
        {
          "submission": {
            "id": "...",
            "imageUrl": "...",
            "imageFocalPoint": {...},
            "text": "...",
            "title": "..."
          }
        }
      ],
      "_count": {
        "submissions": 5
      }
    }
  ]
}
```

### POST `/api/collections`

Create a new collection.

**Request Body:**
```json
{
  "name": "Collection Name",
  "description": "Optional description",
  "isPublic": false
}
```

**Response:**
```json
{
  "collection": {
    "id": "...",
    "name": "Collection Name",
    "description": "...",
    "isPublic": false,
    "createdAt": "...",
    "updatedAt": "...",
    "_count": { "submissions": 0 }
  }
}
```

### GET `/api/collections/[id]`

Get a specific collection with all submissions.

**Behavior:**
- Returns collection if user is owner OR if `isPublic = true`
- Otherwise returns 404

**Response:**
```json
{
  "collection": { ... },
  "isOwner": true
}
```

### PUT `/api/collections/[id]`

Update collection properties (name, description, isPublic).

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "isPublic": true
}
```

**Behavior:**
- Only owner can update

### DELETE `/api/collections/[id]`

Delete a collection.

**Behavior:**
- Only owner can delete
- Does NOT delete the submissions themselves
- Cascade deletes all CollectionSubmission records

### POST `/api/collections/[id]/submissions`

Add submissions to a collection.

**Request Body:**
```json
{
  "submissionIds": ["id1", "id2", "id3"]
}
```

**Behavior:**
- Submissions must belong to the user and be portfolio items
- Duplicate submissions are skipped (idempotent)
- New submissions are appended to the end (next order value)

**Response:**
```json
{
  "added": 2,
  "skipped": 1
}
```

### DELETE `/api/collections/[id]/submissions`

Remove submissions from a collection.

**Request Body:**
```json
{
  "submissionIds": ["id1", "id2"]
}
```

**Response:**
```json
{
  "removed": 2
}
```

### POST `/api/collections/[id]/reorder`

Reorder submissions within a collection.

**Request Body:**
```json
{
  "submissionIds": ["id3", "id1", "id2"]
}
```

**Behavior:**
- Updates the `order` field to match the provided array index (0-based)
- Only owner can reorder

### GET `/api/portfolio/items`

Get portfolio items with optional filtering (used by SubmissionSelector).

**Query Parameters:**
- `search` (optional): Search string filters by title, category, or text content (case-insensitive)
- `excludeIds` (optional, comma-separated): IDs to exclude (e.g., already-added submissions)

**Response:**
```json
{
  "items": [...],
  "totalCount": 100,
  "hasMore": false
}
```

## Pages & Routes

### `/collections` (Authenticated)
Owner's collection management page.

**Features:**
- Lists all collections (both public and private)
- "New Collection" button to create collections
- Grid layout with cover images

### `/collections/[collectionId]` (Authenticated)
Edit a specific collection.

**Features:**
- Edit name/description/public visibility
- Add submissions via autocomplete selector
- View and reorder items with drag-and-drop
- Remove items from collection
- Delete collection
- Share link (for public collections)

### `/portfolio/[userId]/collections` (Public)
List a user's collections.

**Behavior:**
- If viewing own profile: shows all collections
- If viewing another's profile: shows only public collections
- 404s for private collections when not owner

### `/portfolio/[userId]/collections/[collectionId]` (Public)
View a specific collection.

**Behavior:**
- Returns 404 if collection not found
- Returns 404 if collection is private and viewer is not owner
- Shows all submissions in the collection in a grid
- Shows collection name, description, and visibility

## Components

### CollectionCard

Grid card component showing a collection's cover image, name, and item count.

**Props:**
```typescript
interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    userId: string;
    submissions: {
      submission: {
        id: string;
        imageUrl: string | null;
        imageFocalPoint: { x: number; y: number } | null;
        text: string | null;
        title: string | null;
      };
    }[];
    _count: {
      submissions: number;
    };
  };
  isOwner?: boolean;
}
```

**Features:**
- Uses first submission's image as cover
- Shows visibility badge (Lock for private, Globe for public)
- Links to appropriate view/edit page

### CollectionSelectModal

Modal for selecting an existing collection or creating a new one (used from bulk actions in portfolio editor).

**Features:**
- Shows existing collections with covers
- "Create New Collection" option
- Name input required on creation
- Visibility toggle on creation
- Adds selected items to chosen collection

### CollectionCreateButton

Button and dialog for creating a new collection from `/collections` page.

**Features:**
- Opens modal with name, description, and visibility inputs
- Saves and redirects to edit page on success

### SubmissionSelector

Reusable autocomplete component for selecting and adding submissions.

**Props:**
```typescript
interface SubmissionSelectorProps {
  onSelect: (submission: Submission) => void;
  excludeIds?: string[];
  placeholder?: string;
}
```

**Features:**
- Search-on-demand (only loads when user types)
- Debounced search (300ms)
- Excludes specified submission IDs (e.g., already-added items)
- Returns results with thumbnails and metadata
- Uses cmdk (Command) for keyboard navigation

### CollectionEditForm

Form component for editing collection settings and managing items.

**Features:**
- Name and description editing
- Public/private toggle
- Save button (disabled if no changes)
- Submission selector to add items
- PortfolioGrid for displaying/reordering/removing items
- Share button (for public collections)
- Delete collection button

### PortfolioListEditor (Modified)

Added bulk action to select multiple submissions and add to a collection.

**Changes:**
- Added `FolderPlus` icon import
- Added `showCollectionModal` state
- Added `addToCollection` button in bulk actions
- Opens `CollectionSelectModal` on click

## UI Patterns

### Navigation Links

Collections are accessible from:
1. **Portfolio Page**: "Collections" button next to "View Profile" and "Manage Portfolio"
2. **Manage Portfolio Page**: Select items → "Add to Collection" bulk action
3. **My Collections Page**: `/collections` to manage all own collections

### Bulk Action Flow

1. User goes to `/portfolio/edit`
2. Selects one or more portfolio items using checkboxes
3. Clicks "Add to Collection" button
4. Selects existing collection or creates new one
5. Items are added in background
6. Selection is cleared

### Direct Addition Flow

1. User goes to `/collections/[collectionId]`
2. Uses autocomplete selector to search for submissions by name/category
3. Clicks "+" button to add selected submission
4. Submission appears in the item list

### Reordering Flow

1. User edits a collection
2. Drags items in the collection grid
3. Order is saved via `/api/collections/[id]/reorder`

### Visibility Control

**Private Collections:**
- Only visible to owner
- Listed in `/collections` (owner's management page)
- Hidden from `/portfolio/[userId]/collections` for other users
- 404 if someone else tries to access directly

**Public Collections:**
- Visible to anyone via `/portfolio/[userId]/collections`
- Shareable via link
- "Share" button in edit mode copies link to clipboard

## Internationalization

### Translation Keys

All collection-related strings are under `collections` namespace:

**English (en.json):**
```json
{
  "collections": {
    "collections": "collections",
    "collection": "collection",
    "myCollections": "My Collections",
    "collectionsOf": "{name}'s Collections",
    "addToCollection": "Add to Collection",
    "settings": "Settings",
    "items": "items",
    "selectSubmission": "Select a submission",
    "selectSubmissionPlaceholder": "Search and select submissions to add...",
    "searchSubmissions": "Search submissions...",
    "noSubmissions": "No submissions found",
    // ... more keys
  }
}
```

**Spanish (es.json):** Corresponding translations for all keys

## Dependencies

### New Packages

- `cmdk`: Command palette component library for autocomplete search
- `@radix-ui/react-dialog`: Dialog primitives (may already exist)

### shadcn Components

- `command`: Command palette component (newly added)
- `popover`: Popover container (may already exist)
- `textarea`: Text input for descriptions (newly added)
- Existing: button, label, switch, input, etc.

### Icons (lucide-react)

- `FolderPlus`: New collection
- `Check`: Selected item indicator
- `ChevronsUpDown`: Dropdown toggle
- `Loader2`: Loading spinner
- `Plus`: Add button
- `Lock`, `Globe`: Visibility badges
- `ArrowLeft`: Navigation
- `Trash2`: Delete
- `Share2`: Share link
- `Search`: Search icon in CommandInput

## Testing

### Manual Testing Checklist

- Create a collection (private)
- Create a collection (public)
- Add items via bulk action from portfolio editor
- Add items via autocomplete selector in collection edit
- Reorder items via drag-and-drop
- Remove items from collection
- Edit collection name/description
- Toggle visibility between private/public
- Delete a collection
- View own collections list
- View another user's public collections
- Verify private collections are hidden from others
- Search in submission selector by name
- Search in submission selector by category
- Verify submission selector excludes already-added items

## Migration

The collections schema was added in migration `20260119185717_add_collections`.

To apply migration:
```bash
bunx prisma migrate dev
```

To regenerate Prisma client after schema changes:
```bash
bunx prisma generate
```

## Future Enhancements

Potential additions to consider:
- Collection descriptions support markdown formatting
- Bulk edit collection metadata
- Move items between collections
- Duplicate collection functionality
- Collection templates (predefined collections)
- Collection analytics (views, shares)
- Featured collections on profile
- Collection sorting/filtering options
- Collection export/share settings
