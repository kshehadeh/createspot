# Database Documentation

This project uses **PostgreSQL** with **Prisma ORM** for database management.

## Setup

### Prerequisites

- PostgreSQL database (local or remote)
- `DATABASE_URL` environment variable configured

### Connection String

Set `DATABASE_URL` in your `.env` file:

```
DATABASE_URL="postgresql://user:password@localhost:5432/wonder_weekly?schema=public"
```

## Prisma Configuration

### Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database schema definition |
| `prisma.config.ts` | Prisma configuration (migrations path, datasource) |
| `lib/prisma.ts` | Prisma client singleton with connection pooling |
| `app/generated/prisma/` | Generated Prisma client (do not edit) |

### Client Generation

The Prisma client is generated to `app/generated/prisma/` and runs automatically on `bun install` via the `postinstall` script.

To regenerate manually:

```bash
bunx prisma generate
```

### Connection Pooling

The app uses `@prisma/adapter-pg` with a `pg` Pool for connection pooling, which is recommended for serverless environments like Next.js:

```typescript
import { prisma } from "@/lib/prisma";

const users = await prisma.user.findMany();
```

## Schema Overview

### Models

#### User
Core user model integrated with NextAuth.js.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID primary key |
| email | String | Unique email address |
| name | String? | Display name |
| image | String? | Profile image URL |
| isAdmin | Boolean | Admin flag (default: false) |
| bio | String? | User bio (HTML formatted) |
| instagram | String? | Instagram username |
| twitter | String? | Twitter/X username |
| linkedin | String? | LinkedIn username |
| website | String? | Personal website URL |
| featuredSubmissionId | String? | ID of featured submission for profile |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

#### Prompt
Weekly creative prompts with three words.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID primary key |
| weekStart | DateTime | Start of prompt week |
| weekEnd | DateTime | End of prompt week |
| word1, word2, word3 | String | The three prompt words |
| createdByUserId | String | Admin who created the prompt |

#### Submission
User submissions for prompts or standalone portfolio items.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID primary key |
| userId | String | Submitting user |
| promptId | String? | Associated prompt (nullable for portfolio-only items) |
| wordIndex | Int? | Which word (1, 2, or 3) - nullable for portfolio-only items |
| title | String? | Submission title |
| imageUrl | String? | Uploaded image URL |
| text | String? | Sanitized HTML content |
| isPortfolio | Boolean | Whether to show in portfolio section (default: false) |
| tags | String[] | Array of tags for portfolio items (default: []) |
| category | String? | Category (e.g., "Photography", "Writing", "Digital Art") |
| shareStatus | ShareStatus | Visibility control: PRIVATE, PROFILE, or PUBLIC (default: PUBLIC) |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**ShareStatus Enum Values:**
- `PRIVATE` - Only visible to the owner
- `PROFILE` - Visible on the user's profile page
- `PUBLIC` - Visible everywhere (galleries, profile pages, etc.)

**Unique constraint:** One submission per user per prompt per word (`userId + promptId + wordIndex`).  
**Note:** `promptId` and `wordIndex` are nullable to support portfolio-only items that aren't tied to prompts.

**Portfolio Features:**
- Submissions can be marked as portfolio items (`isPortfolio: true`)
- Portfolio items can exist without a `promptId` (standalone creative work)
- Portfolio items can be linked to prompts later (by setting `promptId` and `wordIndex`)
- Prompt submissions can be added to portfolio (by setting `isPortfolio: true`)

**Share Status Behavior:**
- Prompt submissions are automatically set to `PUBLIC` (cannot be changed)
- Portfolio-only items can have any share status (PRIVATE, PROFILE, or PUBLIC)
- When linking a portfolio item to a prompt, share status is automatically set to `PUBLIC`
- Existing submissions without a share status default to `PUBLIC`

#### Favorite
User favorites/bookmarks for submissions.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID primary key |
| userId | String | User who favorited |
| submissionId | String | Favorited submission |
| createdAt | DateTime | When favorited |

**Unique constraint:** One favorite per user per submission (`userId + submissionId`).

#### ProfileView
Tracks unique profile page views for analytics.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID primary key |
| profileUserId | String | Profile being viewed |
| viewerUserId | String? | Logged-in viewer (nullable for anonymous) |
| viewerIpHash | String | Hashed IP address for anonymous tracking |
| viewedAt | DateTime | View timestamp |

**Unique constraints:**
- One view per logged-in user per profile (`profileUserId + viewerUserId`)
- One view per IP hash per profile (`profileUserId + viewerIpHash`)

**Privacy:** IP addresses are hashed using SHA-256 before storage.

#### SubmissionView
Tracks unique submission views for analytics.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID primary key |
| submissionId | String | Submission being viewed |
| viewerUserId | String? | Logged-in viewer (nullable for anonymous) |
| viewerIpHash | String | Hashed IP address for anonymous tracking |
| viewedAt | DateTime | View timestamp |

**Unique constraints:**
- One view per logged-in user per submission (`submissionId + viewerUserId`)
- One view per IP hash per submission (`submissionId + viewerIpHash`)

**Privacy:** IP addresses are hashed using SHA-256 before storage.

#### NextAuth Models
- `Account` - OAuth provider accounts
- `Session` - User sessions
- `VerificationToken` - Email verification tokens

## Migrations

### Create a Migration

After modifying `prisma/schema.prisma`:

```bash
bunx prisma migrate dev --name <migration_name>
```

Example:
```bash
bunx prisma migrate dev --name add_user_role
```

This will:
1. Generate SQL migration file in `prisma/migrations/`
2. Apply the migration to your database
3. Regenerate the Prisma client

### Apply Migrations (Production)

```bash
bunx prisma migrate deploy
```

### View Migration Status

```bash
bunx prisma migrate status
```

### Reset Database (Development Only)

⚠️ **Warning:** This deletes all data!

```bash
bunx prisma migrate reset
```

## Common Tasks

### Explore Data with Prisma Studio

```bash
bunx prisma studio
```

Opens a browser-based GUI at `http://localhost:5555`.

### Push Schema Changes (No Migration)

For rapid prototyping without creating migration files:

```bash
bunx prisma db push
```

⚠️ Not recommended for production - use migrations instead.

### Seed the Database

Create `prisma/seed.ts` and run:

```bash
bunx prisma db seed
```

### Introspect Existing Database

To generate schema from an existing database:

```bash
bunx prisma db pull
```

## Best Practices

1. **Always use migrations** for schema changes in production
2. **Review generated SQL** before applying migrations
3. **Use transactions** for multi-step operations
4. **Import from `@/lib/prisma`** to use the singleton client
5. **Don't edit `app/generated/prisma/`** - it's auto-generated

## Troubleshooting

### "Can't reach database server"

- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running
- Check network/firewall settings

### "Migration failed"

- Run `bunx prisma migrate status` to see current state
- Check for conflicting changes
- Consider `bunx prisma migrate resolve` for stuck migrations

### Client out of sync

```bash
bunx prisma generate
```

---

# Prompts System

## Overview

The prompts system allows admins to create weekly creative prompts consisting of three words. Users can then submit content (images and/or text) for each word.

## Prompt Lifecycle

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Created   │────▶│   Active    │────▶│   Expired   │
│  (Future)   │     │  (Current)  │     │   (Past)    │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                    │
      │                   ▼                    │
      │            Users can submit            │
      │                   │                    │
      ▼                   ▼                    ▼
  Editable           Locked once          Read-only
                   has submissions
```

## Creating Prompts

### Admin UI

Admins access the prompt management interface at `/admin`. The `AdminPrompts` component provides:

- **Create Mode**: Form to create new prompts with three words and date range
- **Edit Mode**: Modify existing prompts (only if no submissions exist)
- **Sidebar**: Shows recent past (5) and upcoming future (5) prompts

### API Endpoint

**POST** `/api/prompts`

```typescript
// Request body
{
  word1: string;      // Required
  word2: string;      // Required
  word3: string;      // Required
  weekStart: string;  // Required - ISO date string
  weekEnd?: string;   // Optional - defaults to weekStart + 7 days
}

// Response
{
  prompt: Prompt
}
```

**Authorization**: Requires admin session (`session.user.isAdmin === true`)

### Validation Rules

1. All three words are required
2. `weekStart` is required
3. `weekEnd` defaults to 7 days after `weekStart` if not provided
4. Only admins can create prompts

## Editing Prompts

**PUT** `/api/prompts`

```typescript
// Request body
{
  id: string;         // Required - prompt ID
  word1?: string;
  word2?: string;
  word3?: string;
  weekStart?: string;
  weekEnd?: string;
}
```

**Constraint**: Cannot edit prompts that have submissions.

## Deleting Prompts

**DELETE** `/api/prompts?id={promptId}`

**Constraint**: Cannot delete prompts that have submissions.

## Querying Prompts

### Get Current Prompt

**GET** `/api/prompts`

Returns the currently active prompt (where `now` is between `weekStart` and `weekEnd`).

### Helper Function

```typescript
import { getCurrentPrompt } from "@/lib/prompts";

const prompt = await getCurrentPrompt();
// Returns null if no active prompt
```

---

# Image Storage (Cloudflare R2)

## Architecture

Images are uploaded directly from the browser to Cloudflare R2 using presigned URLs, bypassing serverless function payload limits:

```
┌──────────────┐     ┌─────────────────┐
│   Browser    │────▶│  /api/upload/   │  1. Request presigned URL
│              │     │     presign     │
│              │◀────│                 │  2. Return presigned URL + public URL
│              │     └─────────────────┘
│              │
│              │     ┌────────────────┐
│              │────▶│  Cloudflare R2 │  3. PUT file directly to R2
└──────────────┘     └────────────────┘
       │
       ▼
┌─────────────────┐
│   PostgreSQL    │  4. Save public URL in submission
│  (stores URL)   │
└─────────────────┘
```

This approach allows uploads up to 10MB without hitting Vercel's 4.5MB serverless function payload limit.

## Configuration

Required environment variables:

```env
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="wonder-weekly"
R2_PUBLIC_URL="https://your-r2-public-url.com"
```

### R2 CORS Configuration

For direct browser uploads to work, you **must** configure CORS on your R2 bucket. Without this, you'll get CORS errors when trying to upload.

#### Step-by-Step Setup

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → Select your bucket → **Settings** → **CORS Policy**
3. Click **Edit CORS Policy** or **Add CORS Policy**
4. Paste the following JSON configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://your-production-domain.com"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "ExposedHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

5. **Important**: Replace `https://your-production-domain.com` with your actual production domain
6. Click **Save**

#### Troubleshooting CORS Errors

If you're still getting CORS errors after configuration:

1. **Verify the origin matches exactly**: The origin in your CORS policy must match exactly what the browser sends (including the protocol `http://` or `https://` and port number)

2. **Check browser console**: Look for the exact error message. It will show which origin is being blocked

3. **Common issues**:
   - Missing `http://localhost:3000` for local development
   - Wrong port number (e.g., using 3001 but only configured 3000)
   - Missing `PUT` method in AllowedMethods
   - Missing `Content-Type` in AllowedHeaders

4. **Test the CORS configuration**: After saving, wait a few seconds for changes to propagate, then try uploading again

5. **For production**: Make sure your production domain is included in the `AllowedOrigins` array

## Upload Flow

### 1. Request Presigned URL

```typescript
const response = await fetch("/api/upload/presign", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fileType: file.type,
    fileSize: file.size,
  }),
});

const { presignedUrl, publicUrl } = await response.json();
```

### 2. Upload Directly to R2

```typescript
await fetch(presignedUrl, {
  method: "PUT",
  body: file,
  headers: { "Content-Type": file.type },
});

// Use publicUrl for the submission
```

### 3. API Processing (`/api/upload/presign`)

1. **Authentication**: Verifies user session
2. **Validation**:
   - File type must be: JPEG, PNG, WebP, or GIF
   - Maximum size: 10MB
3. **Generate Presigned URL**:
   - Creates unique filename: `{userId}/{uuid}.{extension}`
   - Signs a PUT request valid for 5 minutes
4. **Returns**: Presigned URL and final public URL

### 4. Database Storage

The `publicUrl` is stored in the `Submission.imageUrl` field:

```typescript
await prisma.submission.upsert({
  where: { userId_promptId_wordIndex: { userId, promptId, wordIndex } },
  update: { imageUrl: publicUrl, title, text },
  create: { userId, promptId, wordIndex, imageUrl: publicUrl, title, text },
});
```

## File Organization

Files are organized by user ID in R2:

```
bucket/
├── user_abc123/
│   ├── 550e8400-e29b-41d4-a716-446655440000.jpeg
│   └── 6ba7b810-9dad-11d1-80b4-00c04fd430c8.png
├── user_def456/
│   └── ...
```

## Security Considerations

1. **Authentication Required**: Only logged-in users can upload
2. **File Type Validation**: Server-side MIME type checking
3. **Size Limits**: 10MB maximum prevents abuse
4. **Unique Filenames**: UUIDs prevent filename collisions and guessing
5. **User Isolation**: Files organized by user ID

## Displaying Images

Images are served directly from R2's public URL:

```tsx
<img src={submission.imageUrl} alt={submission.title} />
```

The `R2_PUBLIC_URL` should point to either:
- R2's public bucket URL
- A CDN/Cloudflare Workers URL for caching

---

# Portfolio System

## Overview

The portfolio system allows users to showcase their creative work beyond prompt submissions. Portfolio items can be:
- **Standalone**: Created independently without a prompt association
- **Linked to prompts**: Portfolio items can be used as prompt submissions
- **Converted from prompts**: Prompt submissions can be added to portfolio

## Portfolio Item Creation

### Standalone Portfolio Items

Create portfolio-only items (no prompt association):

```typescript
// POST /api/submissions
{
  title: "My Artwork",
  imageUrl: "https://...",
  text: "<p>Description</p>",
  isPortfolio: true,
  tags: ["photography", "nature"],
  category: "Photography",
  shareStatus: "PUBLIC"  // or "PROFILE" or "PRIVATE"
  // No promptId or wordIndex
}
```

**Share Status Options:**
- `"PRIVATE"` - Only visible to you
- `"PROFILE"` - Visible on your profile page
- `"PUBLIC"` - Visible everywhere (default)

### Linking Portfolio Items to Prompts

Link an existing portfolio item to a prompt:

```typescript
// PUT /api/submissions/{id}
{
  promptId: "prompt_123",
  wordIndex: 1  // 1, 2, or 3
}
```

**Note:** When linking to a prompt, `shareStatus` is automatically set to `PUBLIC`.

### Adding Prompt Submissions to Portfolio

Mark a prompt submission as a portfolio item:

```typescript
// PUT /api/submissions/{id}
{
  isPortfolio: true,
  tags: ["landscape"],
  category: "Photography"
}
```

## Querying Portfolio Items

### Get User's Portfolio

```typescript
// GET /api/submissions?portfolio=true&userId={userId}
const response = await fetch(`/api/submissions?portfolio=true&userId=${userId}`);
const { submissions } = await response.json();
```

### Portfolio vs Prompt Submissions

- **Portfolio items**: `isPortfolio: true` (may or may not have `promptId`)
- **Prompt submissions**: `promptId !== null` (may or may not be in portfolio)
- **Both**: Items that are both portfolio items AND prompt submissions

## Portfolio Fields

| Field | Description | Example |
|-------|-------------|---------|
| `isPortfolio` | Whether to show in portfolio section | `true` |
| `tags` | Array of tags for categorization | `["landscape", "nature"]` |
| `category` | Primary category | `"Photography"` |
| `shareStatus` | Visibility control | `"PUBLIC"`, `"PROFILE"`, or `"PRIVATE"` |

## Querying with Share Status

When querying portfolio items, share status filtering is applied automatically:

- **Owner viewing their own items**: See all items (PRIVATE, PROFILE, PUBLIC)
- **Others viewing a profile**: See only PROFILE and PUBLIC items
- **Gallery views**: See only PUBLIC items

**Available Categories:**
- Photography
- Writing
- Digital Art
- Illustration
- Mixed Media
- Design
- Other

---

# Analytics System

## Overview

The analytics system tracks profile views and submission views to provide users with insights into their work's visibility.

## View Tracking

### Profile Views

Tracks unique visitors to user profile pages:

```typescript
// POST /api/profile/view
{
  profileUserId: "user_123"
}
```

**Tracking Logic:**
- Logged-in users: Tracked by `viewerUserId` (one view per user)
- Anonymous users: Tracked by hashed IP address (one view per IP)
- Self-views: Not tracked (users viewing their own profile)

### Submission Views

Tracks unique views of individual submissions:

```typescript
// POST /api/submissions/{id}/view
// No body required - submission ID from URL
```

**Tracking Logic:**
- Logged-in users: Tracked by `viewerUserId` (one view per user)
- Anonymous users: Tracked by hashed IP address (one view per IP)
- Self-views: Not tracked (users viewing their own submissions)

## Analytics API

### Get Profile Analytics

```typescript
// GET /api/profile/analytics?userId={userId}
const response = await fetch(`/api/profile/analytics?userId=${userId}`);
const { analytics } = await response.json();

// Returns:
{
  uniqueVisitors: number,      // Unique profile views
  totalFavorites: number,      // Total favorites on all submissions
  totalViews: number,           // Total views on all submissions
  submissionCount: number,     // Count of prompt submissions
  portfolioCount: number,      // Count of portfolio items
  totalWorkCount: number       // Total submissions (all types)
}
```

**Authorization:** Users can only view their own analytics.

## Privacy Considerations

1. **IP Hashing**: IP addresses are hashed using SHA-256 before storage
2. **No Personal Data**: Only hashed IPs and user IDs are stored
3. **Self-View Exclusion**: Users viewing their own content don't generate views
4. **Unique Tracking**: Each user/IP combination counts as one view

## Database Models

### ProfileView

Stores unique profile page views:
- `profileUserId`: Profile being viewed
- `viewerUserId`: Logged-in viewer (nullable)
- `viewerIpHash`: Hashed IP for anonymous tracking
- Unique constraints prevent duplicate views

### SubmissionView

Stores unique submission views:
- `submissionId`: Submission being viewed
- `viewerUserId`: Logged-in viewer (nullable)
- `viewerIpHash`: Hashed IP for anonymous tracking
- Unique constraints prevent duplicate views
