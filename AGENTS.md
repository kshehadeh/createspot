# AGENTS.md

This document provides essential information for AI agents and developers working on this codebase.

## Project Overview

**Prompts** is a weekly creative prompt community app where admins publish three-word prompts and users submit photos/text inspired by those words.

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with Google OAuth
- **Storage**: Cloudflare R2 for images
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Theme**: next-themes with user-controllable dark/light mode

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
| [docs/DATABASE.md](docs/DATABASE.md) | Database schema, Prisma usage, migrations, image storage |
| [docs/FRONTEND.md](docs/FRONTEND.md) | React components, theming, UI patterns |

## Project Structure

```
app/                    # Next.js App Router pages and API routes
├── api/               # API endpoints
├── admin/             # Admin dashboard (prompts, users)
├── play/              # User submission interface
├── this-week/         # Gallery view
└── history/           # User's past submissions

components/            # Shared React components
├── ui/               # shadcn/ui components (button, dialog, etc.)
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

### Styling & UI Components

- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Accessible component primitives (Radix UI)
- **next-themes** - Theme management with user toggle
- Follow the zinc color palette for consistency
- Use shadcn components when available (button, dialog, dropdown, etc.)

#### Using shadcn/ui Components

Components are located in `components/ui/`. Import and use them directly:

```tsx
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<Button variant="default" size="lg">Click me</Button>
<Input type="text" placeholder="Enter text" />
<Label htmlFor="input-id">Label text</Label>
```

#### Theme System

The app uses `next-themes` for theme management. Users can toggle between light/dark/system via the theme toggle in the header.

- Theme is controlled via CSS variables in `app/globals.css`
- Components automatically adapt to theme via shadcn's CSS variable system
- Use `dark:` prefix for custom dark mode styles when needed

```tsx
// Theme-aware component
<div className="bg-background text-foreground">
  <Button variant="default">Themed Button</Button>
</div>
```

#### Adding New shadcn Components

```bash
bunx shadcn@latest add <component-name>
```

This will add the component to `components/ui/` and update necessary dependencies.

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

1. Client uploads to `/api/upload` via FormData
2. Server validates and uploads to Cloudflare R2
3. Server returns public URL
4. Client saves URL to database via `/api/submissions`

### Current Prompt Query

```typescript
import { getCurrentPrompt } from "@/lib/prompts";

const prompt = await getCurrentPrompt();
// Returns prompt where now is between weekStart and weekEnd
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

### Add a Shared Component

1. Check if a shadcn/ui component exists first (`components/ui/`)
2. If not, create in `components/` directory
3. Use TypeScript interfaces for props
4. Use shadcn components as building blocks when possible
5. Theme-aware components will automatically work with the theme system
6. Export from the file

### Add a New shadcn Component

```bash
bunx shadcn@latest add <component-name>
```

Components are installed to `components/ui/` and can be imported directly.

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
