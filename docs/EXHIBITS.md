# Exhibits Documentation

This document describes how exhibits work in the Create Spot application, including both permanent and temporary exhibits, their database relationships, page structure, and management workflows.

## Overview

The application supports two types of exhibits:

### Permanent Exhibits

**Permanent Exhibits** are hardcoded views that provide different ways to browse all public submissions in the collection. They are not stored in the database and are always available. There are three permanent exhibit types:

1. **Gallery** (`/exhibition/gallery`) - Grid-based browsing with filtering and search
2. **Constellation** (`/exhibition/constellation`) - Interactive 3D visualization
3. **Global** (`/exhibition/global`) - Geographic map view of artists worldwide

These exhibits show all public submissions and can be filtered by category, tags, and search queries.

### Temporary Exhibits

**Temporary Exhibits** are database-driven collections curated by admins. They:

- Have a start and end time
- Can be made active or inactive
- Contain a curated selection of submissions from multiple artists
- Support a subset of the three view types (Gallery, Constellation, Global)
- Have a curator, description (markdown), and optional featured submission
- Are displayed on the main exhibits page when active

Temporary exhibits allow admins to create themed collections, showcase specific work, or highlight particular artists or time periods.

## Database Schema

### Exhibit Model

The `Exhibit` model stores temporary exhibit metadata:

```prisma
model Exhibit {
  id                String   @id @default(cuid())
  title             String
  description       String?  @db.Text              // Markdown description
  startTime         DateTime                        // When exhibit becomes active
  endTime           DateTime                        // When exhibit expires
  isActive          Boolean  @default(true)        // Manual override to hide
  curatorId         String                         // User who curates the exhibit
  featuredSubmissionId String? @unique             // Optional featured submission
  allowedViewTypes  String[] @default(["gallery", "constellation", "global"])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  curator           User     @relation("CuratedExhibits", ...)
  featuredSubmission Submission? @relation("FeaturedInExhibits", ...)
  submissions       ExhibitSubmission[]
}
```

**Key Fields:**
- `startTime` / `endTime`: Define the active time window
- `isActive`: Boolean flag to manually disable even within time window
- `curatorId`: References the `User` who created/curates the exhibit
- `featuredSubmissionId`: Optional submission to highlight on the exhibit page
- `allowedViewTypes`: Array of view types users can access (e.g., `["gallery", "constellation"]`)

### ExhibitSubmission Model

The `ExhibitSubmission` model is a join table linking exhibits to submissions:

```prisma
model ExhibitSubmission {
  id           String   @id @default(cuid())
  exhibitId    String
  submissionId String
  order        Int      // Custom ordering (lower = first)
  createdAt    DateTime @default(now())

  exhibit      Exhibit     @relation(...)
  submission   Submission  @relation(...)

  @@unique([exhibitId, submissionId])
  @@index([exhibitId, order])
}
```

**Key Features:**
- `order`: Allows admins to reorder submissions within an exhibit
- Unique constraint prevents duplicate submissions in the same exhibit
- Indexed on `[exhibitId, order]` for efficient ordered queries

### Relationships

```
User
  ├── curatedExhibits: Exhibit[] (one-to-many)
  │
Exhibit
  ├── curator: User (many-to-one)
  ├── featuredSubmission: Submission? (many-to-one, optional)
  └── submissions: ExhibitSubmission[] (one-to-many)
      │
ExhibitSubmission
  ├── exhibit: Exhibit (many-to-one)
  └── submission: Submission (many-to-one)
      │
Submission
  ├── exhibitSubmissions: ExhibitSubmission[] (one-to-many)
  └── featuredInExhibits: Exhibit[] (one-to-many, via featuredSubmissionId)
```

## Page Structure

### User-Facing Pages

#### Main Exhibits Page
**Route:** `/exhibition`

Displays:
- **Current Exhibits** section: Active temporary exhibits (within time window and `isActive=true`)
- **Upcoming Exhibits** message: Next exhibit if no current ones
- **Permanent Exhibits** section: Gallery, Constellation, Global cards

**Components:**
- `app/exhibition/page.tsx` - Server component
- Uses `getCurrentExhibits()` and `getUpcomingExhibits()` from `lib/exhibits.ts`

#### Temporary Exhibit Detail Page
**Route:** `/exhibition/[exhibitId]`

Displays:
- Exhibit title and description (rendered markdown)
- Curator information
- Featured submission (if set)
- Links to available view types (filtered by `allowedViewTypes`)

**Components:**
- `app/exhibition/[exhibitId]/page.tsx` - Server component
- Uses `getExhibitById()` from `lib/exhibits.ts`

#### Permanent Exhibit Views
**Routes:**
- `/exhibition/gallery`
- `/exhibition/constellation`
- `/exhibition/global`

These views accept an optional `exhibitId` query parameter:
- **Without `exhibitId`**: Shows all public submissions (permanent exhibit behavior)
- **With `exhibitId`**: Shows only submissions within that temporary exhibit

**Components:**
- `app/exhibition/gallery/page.tsx`
- `app/exhibition/constellation/page.tsx`
- `app/exhibition/global/page.tsx`
- `app/exhibition/global/global-map.tsx` (client component)

**Filtering:**
When `exhibitId` is provided:
- All submissions are filtered to those in `ExhibitSubmission` for that exhibit
- Search and filters are scoped to the exhibit's submissions
- Ordering respects the `order` field in `ExhibitSubmission`

### Admin Pages

#### Exhibits Management
**Route:** `/admin/exhibits`

Grid view of all exhibits with:
- Featured images or generic icons
- Status badges (Active, Inactive, Upcoming)
- Submission counts
- Curator information
- Search by title
- Filters by curator and status

**Components:**
- `app/admin/exhibits/page.tsx` - Server component
- `app/admin/exhibits/exhibit-grid.tsx` - Client component
- `app/admin/exhibits/exhibit-filters.tsx` - Client component

#### Create Exhibit
**Route:** `/admin/exhibits/new`

Form for creating a new temporary exhibit:
- Title, description (markdown editor)
- Start/end times
- Active toggle
- Curator selection
- Allowed view types (checkboxes)
- Featured submission selector

**Components:**
- `app/admin/exhibits/new/page.tsx` - Server component
- `app/admin/exhibits/exhibit-form-simple.tsx` - Client component

#### Edit Exhibit
**Route:** `/admin/exhibits/[id]/edit`

Form for editing an existing exhibit (same fields as create):
- Pre-populated with existing data
- "Manage Content" button to navigate to content management

**Components:**
- `app/admin/exhibits/[id]/edit/page.tsx` - Server component
- `app/admin/exhibits/exhibit-form-simple.tsx` - Client component

#### Manage Content
**Route:** `/admin/exhibits/[id]/content`

Interface for managing submissions within an exhibit:
- Add submissions via full-screen browser dialog
- Remove submissions from exhibit
- Reorder submissions via drag-and-drop
- Uses `PortfolioGrid` component in "exhibit" mode

**Components:**
- `app/admin/exhibits/[id]/content/page.tsx` - Server component
- `app/admin/exhibits/exhibit-content-manager.tsx` - Client component
- `app/admin/exhibits/submission-browser.tsx` - Client component (full-screen dialog)

## API Routes

### List/Create Exhibits
**Route:** `/api/exhibits`
- `GET`: Returns all exhibits (admin) or active exhibits (public)
- `POST`: Creates new exhibit (admin only)

### Single Exhibit
**Route:** `/api/exhibits/[id]`
- `GET`: Returns exhibit with nested submissions
- `PUT`: Updates exhibit (admin only)
- `DELETE`: Deletes exhibit (admin only)

### Exhibit Submissions
**Route:** `/api/exhibits/[id]/submissions`
- `POST`: Adds submissions to exhibit (handles duplicates, sets order)
- `DELETE`: Removes submission from exhibit

### Reorder Submissions
**Route:** `/api/exhibits/[id]/reorder`
- `POST`: Updates `order` field for submissions in exhibit

### Featured Submission
**Route:** `/api/exhibits/[id]/featured`
- `PUT`: Sets `featuredSubmissionId` for exhibit

## Library Functions

### `lib/exhibits.ts`

Server-side functions for fetching exhibit data:

- `getCurrentExhibits()`: Returns active exhibits within their timeframes
- `getUpcomingExhibits()`: Returns the next upcoming exhibit
- `getExhibitById(id)`: Returns a single exhibit with curator and featured submission
- `getExhibitSubmissions(exhibitId, options?)`: Returns submissions for an exhibit, ordered

### `lib/exhibit-utils.ts`

Client-safe utility functions:

- `isExhibitActive(exhibit)`: Checks if exhibit is currently active (within time window and `isActive=true`)

### `lib/exhibition.ts`

Core exhibition filtering logic (used by both permanent and temporary exhibits):

- `getExhibitionSubmissions(options)`: Fetches submissions with optional `exhibitId` filter
- `getExhibitionFacets(exhibitId?)`: Returns available categories and tags (scoped to exhibit if provided)
- `buildExhibitionWhere(options)`: Builds Prisma where clause with optional exhibit filtering

**Key Behavior:**
When `exhibitId` is provided:
1. Fetches `ExhibitSubmission` records for the exhibit (ordered by `order`)
2. Filters submissions to only those in the exhibit
3. Maintains the custom order from `ExhibitSubmission.order`

## Workflow

### Creating a Temporary Exhibit

1. Admin navigates to `/admin/exhibits`
2. Clicks "Create New Exhibit"
3. Fills out form:
   - Title, description (markdown)
   - Start/end times
   - Selects curator
   - Chooses allowed view types
   - Optionally selects featured submission
4. Submits form → exhibit created in database
5. Admin clicks "Manage Content" button in form
6. Adds submissions via browser dialog (search, filter, multi-select)
7. Reorders submissions via drag-and-drop
8. Exhibit appears on `/exhibition` when active

### Viewing a Temporary Exhibit

1. User navigates to `/exhibition`
2. Sees "Current Exhibits" section with active temporary exhibits
3. Clicks on an exhibit card
4. Views exhibit detail page (`/exhibition/[exhibitId]`)
5. Sees description, curator, featured submission
6. Clicks a view type button (e.g., "Gallery")
7. Navigates to `/exhibition/gallery?exhibitId=[id]`
8. Views filtered submissions in that view type

### Permanent Exhibits

1. User navigates to `/exhibition`
2. Sees "Permanent Exhibits" section
3. Clicks on Gallery, Constellation, or Global
4. Views all public submissions in that view type
5. Can filter by category, tags, search query
6. No database queries for exhibit metadata (hardcoded)

## Navigation Integration

### Header Dropdown

The `ExhibitionsDropdown` component (`components/exhibitions-dropdown.tsx`) dynamically fetches current exhibits and displays them above permanent exhibits in the navigation menu.

### Breadcrumbs

Breadcrumbs are handled in `components/header.tsx`:
- `/exhibition` → ["Exhibit"]
- `/exhibition/gallery` → ["Exhibit", "Gallery"]
- `/exhibition/[exhibitId]` → ["Exhibit"]
- `/admin/exhibits` → ["Admin", "Exhibits"]
- `/admin/exhibits/new` → ["Admin", "Exhibits", "New"]
- `/admin/exhibits/[id]/edit` → ["Admin", "Exhibits", "Edit"]
- `/admin/exhibits/[id]/content` → ["Admin", "Exhibits", "Content"]

## Key Design Decisions

1. **Permanent vs Temporary**: Permanent exhibits are hardcoded views, temporary exhibits are database-driven. This allows flexibility for curated content while maintaining simple, always-available browsing options.

2. **Reusable Views**: The same view components (Gallery, Constellation, Global) work for both permanent and temporary exhibits via the `exhibitId` query parameter. This reduces code duplication.

3. **Ordering**: Temporary exhibits support custom ordering via `ExhibitSubmission.order`, allowing curators to control the presentation sequence.

4. **View Type Selection**: Admins can choose which view types are available for each temporary exhibit, allowing for themed experiences (e.g., only Gallery view for a photography exhibit).

5. **Active Status**: The combination of `startTime`, `endTime`, and `isActive` provides flexible control over exhibit visibility.

6. **Featured Submissions**: Both user profiles and exhibits support featured submissions, providing a consistent way to highlight important work.

## Related Documentation

- [DATABASE.md](./DATABASE.md) - Database schema and Prisma usage
- [FRONTEND.md](./FRONTEND.md) - React components and UI patterns
- [USERFLOW.md](./USERFLOW.md) - User navigation and sitemap
