# AGENTS.md

This document provides essential information for AI agents and developers working on this codebase.

## Project Overview

**Create Spot** is a creative community platform for artists and writers where:
- Artists showcase their creative work in personal portfolios
- Users participate in weekly three-word creative prompts
- Artists and writers can display analytics and track engagement
- Community discovers and favorites creative work

**Key Features:**
- Artist portfolios for showcasing independent creative work
- Weekly creative prompts with three words (under `/prompt` path)
- Cross-linking between portfolio items and prompt submissions
- Profile analytics (views, favorites, engagement)
- View tracking for profiles and submissions

**Tech Stack:**
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with Google OAuth
- **Storage**: Cloudflare R2 for images
- **Styling**: Tailwind CSS 4

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
bunx prisma migrate dev

# Start development server
bun run dev
```

The app will be available at http://localhost:3000

## Documentation

| Document | Description |
|----------|-------------|
| [docs/DATABASE.md](docs/DATABASE.md) | Database schema, Prisma usage, migrations, image storage, portfolio system, analytics |
| [docs/FRONTEND.md](docs/FRONTEND.md) | React components, theming, UI patterns, portfolio components |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Overall system architecture, data flow, design decisions |

## Project Structure

```
app/                    # Next.js App Router pages and API routes
├── api/               # API endpoints
│   ├── profile/       # Profile management, analytics, view tracking
│   ├── submissions/   # Submission CRUD, portfolio operations
│   └── ...
├── admin/             # Admin dashboard (prompts, users)
├── favorites/         # User favorites page
├── prompt/            # Weekly prompt game (moved from root)
│   ├── this-week/     # Gallery view for current prompt
│   ├── play/          # User submission interface (with portfolio linking)
│   └── history/       # User's past prompt submissions
├── profile/           # User profile pages
│   ├── [userId]/      # Public profile view
│   └── edit/          # Profile editing with portfolio management
├── s/                 # Submission detail pages
│   └── [id]/          # Individual submission view
└── page.tsx           # Homepage featuring artists and portfolios

components/            # Shared React components
├── portfolio-grid.tsx        # Portfolio item grid display
├── portfolio-item-form.tsx   # Portfolio item creation/editing
├── profile-analytics.tsx     # Analytics display
├── profile-view-tracker.tsx  # View tracking component
└── ...

lib/                   # Utilities (auth, prisma, helpers)
prisma/                # Database schema and migrations
public/                # Static assets
docs/                  # Developer documentation
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run oxlint |
| `bun run format` | Format code with Biome |
| `bun run format:check` | Check formatting without changes |

## Toolchain

### Package Manager: Bun

This project uses **Bun** as the package manager and runtime. Always use `bun` commands:

```bash
bun install          # Install dependencies
bun add <package>    # Add dependency
bun add -d <package> # Add dev dependency
bun run <script>     # Run npm script
```

### Linting: oxlint

Fast linter from the OXC project. Run with:

```bash
bun run lint
```

### Formatting: Biome

Code formatting via Biome (OXC ecosystem). Configuration in `biome.json`:

- **Indent**: 2 spaces
- **Quotes**: Double quotes
- **Semicolons**: Always

```bash
bun run format       # Format all files
bun run format:check # Check without modifying
```

### TypeScript

Strict mode enabled. Key settings in `tsconfig.json`:

- `strict: true` - All strict checks enabled
- `@/*` path alias maps to project root

### Database: Prisma

```bash
bunx prisma generate     # Regenerate client
bunx prisma migrate dev  # Create and apply migration
bunx prisma studio       # Open database GUI
```

## Coding Standards

### TypeScript

- Use strict typing; avoid `any`
- Prefer interfaces over type aliases for object shapes
- Use `@/*` import alias for project imports

```typescript
// Good
import { prisma } from "@/lib/prisma";
import type { User } from "@/app/generated/prisma/client";

// Avoid
import { prisma } from "../../../lib/prisma";
```

### React Components

- **Server Components** by default (no directive needed)
- **Client Components** only when required (`"use client"` at top)
- Co-locate page-specific components in their route folder
- Extract to `/components` when reused across pages

```typescript
// Server Component (default)
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}

// Client Component (when needed)
"use client";
export function InteractiveComponent() {
  const [state, setState] = useState();
  // ...
}
```

### Styling

- Use Tailwind CSS utility classes
- Follow the zinc color palette for consistency
- Always include dark mode variants with `dark:` prefix

```tsx
<div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
```

### API Routes

- Located in `app/api/` directory
- Use NextResponse for responses
- Always validate authentication with `auth()`
- Return appropriate HTTP status codes

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Handle request...
}
```

### Database Access

- Always import prisma from `@/lib/prisma`
- Use Prisma's type-safe queries
- Handle errors appropriately

```typescript
import { prisma } from "@/lib/prisma";

const user = await prisma.user.findUnique({
  where: { id: userId },
});
```

## Environment Variables

Required variables (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | Random secret for NextAuth |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public URL for R2 bucket |

## Key Patterns

### Authentication Check

```typescript
const session = await auth();
if (!session?.user) {
  // Handle unauthenticated
}
if (!session?.user?.isAdmin) {
  // Handle non-admin
}
```

### Image Upload Flow

1. Client requests presigned URL from `/api/upload/presign`
2. Server generates presigned PUT URL (5-minute expiry)
3. Client uploads directly to Cloudflare R2
4. Client saves public URL to database via `/api/submissions`

### Current Prompt Query

```typescript
import { getCurrentPrompt } from "@/lib/prompts";

const prompt = await getCurrentPrompt();
// Returns prompt where now is between weekStart and weekEnd
```

### Portfolio Operations

**Create Portfolio Item:**
```typescript
// POST /api/submissions
{
  title: "My Artwork",
  imageUrl: "...",
  text: "<p>Description</p>",
  isPortfolio: true,
  tags: ["photography", "nature"],
  category: "Photography",
  shareStatus: "PUBLIC"  // or "PROFILE" or "PRIVATE"
  // No promptId or wordIndex for standalone items
}
```

**Link Portfolio Item to Prompt:**
```typescript
// PUT /api/submissions/{id}
{
  promptId: "prompt_123",
  wordIndex: 1  // 1, 2, or 3
}
// Note: Linking to a prompt automatically sets shareStatus to "PUBLIC"
```

**Add Prompt Submission to Portfolio:**
```typescript
// PUT /api/submissions/{id}
{
  isPortfolio: true,
  tags: ["landscape"],
  category: "Photography"
}
```

**Query Portfolio Items:**
```typescript
// GET /api/submissions?portfolio=true&userId={userId}
const response = await fetch(`/api/submissions?portfolio=true&userId=${userId}`);
const { submissions } = await response.json();
// Note: Results are filtered by shareStatus based on ownership
```

### Share Status

Submissions have a `shareStatus` field that controls visibility:

| Status | Description |
|--------|-------------|
| `PRIVATE` | Only visible to the owner |
| `PROFILE` | Visible on the user's profile page |
| `PUBLIC` | Visible everywhere (galleries, profile pages, etc.) |

**Key Behaviors:**
- Prompt submissions are always `PUBLIC` (cannot be changed)
- Portfolio-only items can have any share status
- When linking a portfolio item to a prompt, `shareStatus` is automatically set to `PUBLIC`
- Existing submissions without a share status default to `PUBLIC`

**Query Filtering:**
- Gallery views (`getPromptSubmissions`): Only returns `PUBLIC` submissions
- Profile page views: Owners see all; others see `PROFILE` and `PUBLIC` only
- Individual submission pages: `PRIVATE` returns 404 for non-owners

### Analytics

**Get Profile Analytics:**
```typescript
// GET /api/profile/analytics?userId={userId}
// Returns: uniqueVisitors, totalFavorites, totalViews, submissionCount, portfolioCount, totalWorkCount
```

**Track Profile View:**
```typescript
// POST /api/profile/view
{ profileUserId: "user_123" }
// Automatically handled by ProfileViewTracker component
```

**Track Submission View:**
```typescript
// POST /api/submissions/{id}/view
// No body required
```

## Testing

> Note: Test infrastructure is not yet set up. When adding tests:
> - Use Vitest or Jest for unit tests
> - Use Playwright for E2E tests
> - Place tests adjacent to source files or in `__tests__` directories

## Common Tasks

### Add a New Page

1. Create route folder in `app/` (e.g., `app/new-page/`)
2. Add `page.tsx` with default export
3. Add to navigation in relevant layouts/headers

### Add a New API Endpoint

1. Create route file in `app/api/` (e.g., `app/api/endpoint/route.ts`)
2. Export HTTP method handlers (GET, POST, PUT, DELETE)
3. Include authentication check if needed

### Modify Database Schema

1. Edit `prisma/schema.prisma`
2. Run `bunx prisma migrate dev --name <description>`
3. Update TypeScript types if needed (auto-generated)

**Note:** If migration fails due to checksum mismatch:
- Check `_prisma_migrations` table for modified migrations
- Update checksum: `UPDATE _prisma_migrations SET checksum = '<new_hash>' WHERE migration_name = '<name>';`
- Or use `bunx prisma migrate resolve` if applicable

### Add a Shared Component

1. Create in `components/` directory
2. Use TypeScript interfaces for props
3. Include dark mode styles
4. Export from the file

### Work with Portfolio Items

**Key Points:**
- Portfolio items can exist without `promptId` (standalone)
- Portfolio items can be linked to prompts (set `promptId` + `wordIndex`)
- Prompt submissions can be added to portfolio (set `isPortfolio: true`)
- Always check for nullable `promptId` and `wordIndex` in TypeScript
- Use `isPortfolio: true` to query portfolio items
- Portfolio items support `tags` (array) and `category` (string) fields

## Troubleshooting

### Prisma client out of sync

```bash
bunx prisma generate
```

### Database connection issues

- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Check network/firewall settings

### Type errors after schema change

```bash
bunx prisma generate
# Restart TypeScript server in your editor
```

### Formatting issues

```bash
bun run format
```

### Portfolio-related Type Errors

If you see errors about `wordIndex` or `promptId` being possibly null:
- These fields are intentionally nullable for portfolio-only items
- Always check for null before accessing: `submission.wordIndex ? ... : ...`
- Use optional chaining: `submission.prompt?.word1`
- Update interface definitions to use `number | null` for `wordIndex`
