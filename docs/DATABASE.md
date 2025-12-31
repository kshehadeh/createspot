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
User submissions for a prompt word.

| Field | Type | Description |
|-------|------|-------------|
| id | String | CUID primary key |
| userId | String | Submitting user |
| promptId | String | Associated prompt |
| wordIndex | Int | Which word (1, 2, or 3) |
| title | String? | Submission title |
| imageUrl | String? | Uploaded image URL |
| text | String? | Sanitized HTML content |

**Unique constraint:** One submission per user per prompt per word (`userId + promptId + wordIndex`).

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

```
┌──────────────┐     ┌─────────────────┐     ┌────────────────┐
│   Browser    │────▶│  Next.js API    │────▶│  Cloudflare R2 │
│  (FormData)  │     │  /api/upload    │     │    (S3 API)    │
└──────────────┘     └─────────────────┘     └────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │   PostgreSQL    │
                     │  (stores URL)   │
                     └─────────────────┘
```

Images are stored in Cloudflare R2 (S3-compatible storage), and only the public URL is stored in the database.

## Configuration

Required environment variables:

```env
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="wonder-weekly"
R2_PUBLIC_URL="https://your-r2-public-url.com"
```

## Upload Flow

### 1. Client Upload

```typescript
const formData = new FormData();
formData.append("file", file);

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
});

const { imageUrl } = await response.json();
```

### 2. API Processing (`/api/upload`)

1. **Authentication**: Verifies user session
2. **Validation**:
   - File type must be: JPEG, PNG, WebP, or GIF
   - Maximum size: 10MB
3. **Upload to R2**:
   - Generates unique filename: `{userId}/{uuid}.{extension}`
   - Uploads via AWS S3 SDK (R2 is S3-compatible)
4. **Returns**: Public URL for the uploaded image

### 3. Database Storage

The returned `imageUrl` is stored in the `Submission.imageUrl` field:

```typescript
await prisma.submission.upsert({
  where: { userId_promptId_wordIndex: { userId, promptId, wordIndex } },
  update: { imageUrl, title, text },
  create: { userId, promptId, wordIndex, imageUrl, title, text },
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
