# Entity Relationships

This document describes the relationships between the three core entities in the Prompts application: **Profiles**, **Portfolios**, and **Collections**.

## Overview

The application centers around three main entities:

1. **Profile (User)**: The user account and profile information
2. **Portfolio (Submissions)**: Creative work items that can be displayed in a user's portfolio
3. **Collection**: User-curated groups of portfolio items with custom ordering and visibility

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User (Profile)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ id, email, name, bio, profileImageUrl, etc.              │  │
│  │ featuredSubmissionId (optional)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ 1:N
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────┐                 ┌───────────────────┐
│   Submission      │                 │   Collection      │
│   (Portfolio)     │                 │                   │
│                   │                 │                   │
│ - id              │                 │ - id              │
│ - userId          │                 │ - userId          │
│ - promptId?       │                 │ - name            │
│ - wordIndex?      │                 │ - description?    │
│ - title?          │                 │ - isPublic        │
│ - imageUrl?       │                 │ - createdAt       │
│ - text?           │                 │ - updatedAt       │
│ - isPortfolio     │                 └───────────────────┘
│ - portfolioOrder │                           │
│ - tags            │                           │ 1:N
│ - category?       │                           │
│ - shareStatus     │                           │
│ - createdAt       │                           │
│ - updatedAt       │                           │
└───────────────────┘                           │
        │                                       │
        │                                       │
        │ N:M                                   │
        └───────────────┬───────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ CollectionSubmission  │
            │                       │
            │ - id                  │
            │ - collectionId        │
            │ - submissionId        │
            │ - order               │
            │ - createdAt           │
            └───────────────────────┘
```

## Core Relationships

### 1. User → Submissions (1:N)

**Relationship**: One user can have many submissions

**Key Points**:
- Every submission belongs to exactly one user (`userId` foreign key)
- Submissions can be deleted when a user is deleted (CASCADE)
- Submissions can be either:
  - **Prompt submissions**: Linked to a weekly prompt (`promptId` and `wordIndex` set)
  - **Portfolio items**: Marked with `isPortfolio: true`
  - **Both**: Can be both a prompt submission AND a portfolio item

**Database Constraint**:
```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

**Example**:
```typescript
// User with multiple submissions
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    submissions: {
      where: { isPortfolio: true },
      orderBy: { portfolioOrder: 'asc' }
    }
  }
});
```

### 2. User → Collections (1:N)

**Relationship**: One user can have many collections

**Key Points**:
- Every collection belongs to exactly one user (`userId` foreign key)
- Collections are deleted when a user is deleted (CASCADE)
- Collections can be private (`isPublic: false`) or public (`isPublic: true`)
- Each collection has its own name, description, and visibility settings

**Database Constraint**:
```prisma
user User @relation(fields: [userId], references: [id], onDelete: Cascade)
```

**Example**:
```typescript
// User with their collections
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    collections: {
      where: { isPublic: true }, // or omit for all collections
      include: {
        _count: { select: { submissions: true } }
      }
    }
  }
});
```

### 3. Submission ↔ Collection (N:M)

**Relationship**: Many-to-many relationship via `CollectionSubmission` junction table

**Key Points**:
- A submission can belong to multiple collections
- A collection can contain multiple submissions
- Each collection has its own independent ordering (`order` field)
- The same submission can appear in different collections with different positions
- Deleting a submission removes it from all collections (CASCADE)
- Deleting a collection does NOT delete the submissions

**Database Constraints**:
```prisma
// Junction table
model CollectionSubmission {
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  
  @@unique([collectionId, submissionId]) // Prevents duplicates
}
```

**Example**:
```typescript
// Get a collection with its submissions in order
const collection = await prisma.collection.findUnique({
  where: { id: collectionId },
  include: {
    submissions: {
      include: { submission: true },
      orderBy: { order: 'asc' }
    }
  }
});

// Get all collections containing a specific submission
const collections = await prisma.collection.findMany({
  where: {
    submissions: {
      some: { submissionId: submissionId }
    }
  }
});
```

### 4. User → Featured Submission (1:1, Optional)

**Relationship**: A user can optionally feature one submission on their profile

**Key Points**:
- `featuredSubmissionId` is nullable (user may not have a featured submission)
- When a featured submission is deleted, the reference is set to NULL (SET NULL)
- Only one submission can be featured at a time

**Database Constraint**:
```prisma
featuredSubmission Submission? @relation("FeaturedSubmission", fields: [featuredSubmissionId], references: [id], onDelete: SetNull)
```

**Example**:
```typescript
// Get user with featured submission
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    featuredSubmission: true
  }
});
```

## Entity Characteristics

### Profile (User)

**Purpose**: Represents a user account and their profile information

**Key Attributes**:
- Identity: `id`, `email`, `name`
- Profile: `bio`, `profileImageUrl`, `profileImageFocalPoint`
- Social: `instagram`, `twitter`, `linkedin`, `website`
- Location: `city`, `stateProvince`, `country`, `latitude`, `longitude`
- Preferences: `language`, `enableWatermark`, `protectFromDownload`
- Featured: `featuredSubmissionId` (optional)

**Relationships**:
- Has many `submissions` (portfolio items and prompt submissions)
- Has many `collections`
- Has one optional `featuredSubmission`

### Portfolio (Submission)

**Purpose**: Represents a piece of creative work (image and/or text)

**Key Attributes**:
- Content: `title`, `imageUrl`, `imageFocalPoint`, `text`
- Classification: `isPortfolio`, `category`, `tags`
- Prompt Link: `promptId`, `wordIndex` (nullable)
- Organization: `portfolioOrder` (for portfolio display)
- Visibility: `shareStatus` (PRIVATE, PROFILE, PUBLIC)
- Features: `critiquesEnabled`

**Submission Types**:

1. **Prompt Submission Only**:
   - `promptId` is set
   - `wordIndex` is set (1, 2, or 3)
   - `isPortfolio` is `false`

2. **Portfolio Item Only**:
   - `promptId` is `null`
   - `wordIndex` is `null`
   - `isPortfolio` is `true`

3. **Both**:
   - `promptId` is set
   - `wordIndex` is set
   - `isPortfolio` is `true`

**Relationships**:
- Belongs to one `user`
- Can belong to many `collections` (via `CollectionSubmission`)
- Can optionally be featured by a `user`

### Collection

**Purpose**: User-curated group of portfolio items with custom organization

**Key Attributes**:
- Identity: `name`, `description`
- Visibility: `isPublic` (private or public)
- Ownership: `userId`
- Timestamps: `createdAt`, `updatedAt`

**Key Behaviors**:
- **Independent Ordering**: Each collection has its own `order` values, separate from portfolio `portfolioOrder`
- **Reusability**: Submissions can appear in multiple collections
- **Visibility Control**: Private collections are only visible to the owner
- **Non-destructive**: Deleting a collection does NOT delete the submissions

**Relationships**:
- Belongs to one `user`
- Contains many `submissions` (via `CollectionSubmission`)

## Relationship Patterns

### Pattern 1: User Creates Portfolio Item

```
User → creates → Submission (isPortfolio: true)
```

**Flow**:
1. User creates a submission with `isPortfolio: true`
2. Submission is added to their portfolio
3. Submission can later be added to collections

### Pattern 2: User Creates Collection from Portfolio

```
User → creates → Collection
User → selects → Submissions (from portfolio)
Collection → contains → Submissions (via CollectionSubmission)
```

**Flow**:
1. User creates a new collection
2. User selects existing portfolio items
3. Items are added to the collection with custom ordering
4. Items remain in the portfolio AND appear in the collection

### Pattern 3: Submission in Multiple Collections

```
Submission → belongs to → Collection A (order: 1)
Submission → belongs to → Collection B (order: 5)
Submission → belongs to → Collection C (order: 2)
```

**Key Point**: The same submission can have different positions in different collections.

### Pattern 4: Portfolio Order vs Collection Order

```
Portfolio Display:
  Submission A (portfolioOrder: 1)
  Submission B (portfolioOrder: 2)
  Submission C (portfolioOrder: 3)

Collection "Nature" Display:
  Submission C (order: 1)  ← Different order!
  Submission A (order: 2)
```

**Key Point**: Collection ordering is independent of portfolio ordering.

## Data Flow Examples

### Example 1: Viewing a User's Portfolio

```typescript
// Get user's portfolio items
const portfolio = await prisma.submission.findMany({
  where: {
    userId: userId,
    isPortfolio: true
  },
  orderBy: { portfolioOrder: 'asc' }
});
```

### Example 2: Viewing a User's Collections

```typescript
// Get user's public collections (or all if owner)
const collections = await prisma.collection.findMany({
  where: {
    userId: userId,
    ...(isOwner ? {} : { isPublic: true })
  },
  include: {
    submissions: {
      include: { submission: true },
      orderBy: { order: 'asc' }
    },
    _count: { select: { submissions: true } }
  }
});
```

### Example 3: Adding Items to Collection

```typescript
// Add submissions to a collection
const existingOrders = await prisma.collectionSubmission.findMany({
  where: { collectionId },
  select: { order: true },
  orderBy: { order: 'desc' },
  take: 1
});

const nextOrder = existingOrders[0]?.order ?? -1;

await prisma.collectionSubmission.createMany({
  data: submissionIds.map((submissionId, index) => ({
    collectionId,
    submissionId,
    order: nextOrder + index + 1
  }))
});
```

### Example 4: Reordering Collection Items

```typescript
// Reorder submissions in a collection
const updates = submissionIds.map((submissionId, index) =>
  prisma.collectionSubmission.update({
    where: {
      collectionId_submissionId: {
        collectionId,
        submissionId
      }
    },
    data: { order: index }
  })
);

await Promise.all(updates);
```

## Constraints and Rules

### Database Constraints

1. **Unique Submission in Collection**: A submission can only appear once per collection
   ```prisma
   @@unique([collectionId, submissionId])
   ```

2. **Unique Prompt Submission**: One submission per user per prompt per word
   ```prisma
   @@unique([userId, promptId, wordIndex])
   ```

3. **Cascade Deletes**:
   - Deleting a user deletes all their submissions and collections
   - Deleting a submission removes it from all collections
   - Deleting a collection removes all `CollectionSubmission` records

4. **Set Null on Featured Submission**: If featured submission is deleted, user's `featuredSubmissionId` is set to NULL

### Business Rules

1. **Collection Visibility**:
   - Private collections (`isPublic: false`) are only visible to the owner
   - Public collections (`isPublic: true`) are visible to anyone
   - Users can only edit/delete their own collections

2. **Portfolio Items in Collections**:
   - Only portfolio items (`isPortfolio: true`) can be added to collections
   - Submissions must belong to the collection owner

3. **Ordering Independence**:
   - Portfolio order (`portfolioOrder`) is separate from collection order (`order`)
   - Changing portfolio order does not affect collection order
   - Each collection maintains its own ordering

4. **Submission Types**:
   - A submission can be a prompt submission, portfolio item, or both
   - Portfolio items can exist without a prompt association
   - Prompt submissions can be added to portfolio later

## Common Queries

### Get User's Complete Profile Data

```typescript
const profile = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    featuredSubmission: true,
    submissions: {
      where: { isPortfolio: true },
      orderBy: { portfolioOrder: 'asc' },
      take: 10
    },
    collections: {
      where: { isPublic: true },
      include: {
        _count: { select: { submissions: true } }
      }
    },
    _count: {
      select: {
        submissions: { where: { isPortfolio: true } },
        collections: true
      }
    }
  }
});
```

### Get Collection with All Submissions

```typescript
const collection = await prisma.collection.findUnique({
  where: { id: collectionId },
  include: {
    user: {
      select: { id: true, name: true, image: true }
    },
    submissions: {
      include: {
        submission: {
          include: {
            user: {
              select: { id: true, name: true, image: true }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    },
    _count: { select: { submissions: true } }
  }
});
```

### Check if Submission is in Collection

```typescript
const exists = await prisma.collectionSubmission.findUnique({
  where: {
    collectionId_submissionId: {
      collectionId,
      submissionId
    }
  }
}) !== null;
```

## Summary

- **Profile (User)**: The central entity that owns both portfolio items and collections
- **Portfolio (Submission)**: Creative work items that can be organized in collections
- **Collection**: User-curated groups of portfolio items with independent ordering and visibility

**Key Relationships**:
- User 1:N Submissions (portfolio items)
- User 1:N Collections
- Submission N:M Collection (via CollectionSubmission)
- User 1:1 Featured Submission (optional)

**Key Behaviors**:
- Collections have independent ordering from portfolio
- Submissions can belong to multiple collections
- Collections are non-destructive (deleting doesn't delete submissions)
- Portfolio items can be prompt submissions, standalone items, or both
