# Create Spot

A weekly creative prompt community app where admins publish three-word prompts and users submit photos/text inspired by those words.

## Overview

Create Spot is a full-stack web application built with Next.js that enables a creative community to participate in weekly challenges. Each week, administrators publish a prompt consisting of three words, and community members submit creative work (images and/or text) inspired by those words. The platform includes features for showcasing portfolios, tracking favorites, viewing analytics, and discovering community work.

**Tech Stack:**
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with Google OAuth
- **Storage**: Cloudflare R2 for images
- **Styling**: Tailwind CSS 4
- **Animation**: Framer Motion

## Purpose

Create Spot serves as a platform for:

- **Weekly Creative Challenges**: Admins create prompts with three words, and users submit creative interpretations
- **Portfolio Showcase**: Users can build and display portfolios of their creative work
- **Community Discovery**: Browse and favorite submissions from other community members
- **Analytics & Insights**: Track profile views, submission views, and engagement metrics
- **Social Features**: Follow creators, share work, and build a creative community

The platform encourages regular creative practice through weekly prompts while providing tools for artists to showcase their broader body of work.

## Parts

Create Spot consists of several interconnected systems:

### Core Features

- **Prompt System**: Weekly three-word prompts with start/end dates. See [Database Documentation - Prompts System](apps/web/docs/DATABASE.md#prompts-system)
- **Submission System**: Users submit images and/or text for each prompt word. Submissions can be linked to prompts or exist as standalone portfolio items
- **Portfolio System**: Users can create portfolio items, link them to prompts, or convert prompt submissions to portfolio items. See [Database Documentation - Portfolio System](apps/web/docs/DATABASE.md#portfolio-system)
- **Favorites System**: Users can favorite submissions from other creators
- **Analytics System**: Track profile views and submission views with privacy-conscious IP hashing. See [Database Documentation - Analytics System](apps/web/docs/DATABASE.md#analytics-system)

### User-Facing Pages

- **Home** (`/`): Landing page with current prompt and featured content
- **Play** (`/prompt/play`): Submission interface for the current week's prompt
- **This Week** (`/prompt/this-week`): Gallery view of current week's submissions
- **History** (`/prompt/history`): User's past submissions
- **Exhibition** (`/exhibition`): Browse all submissions with filtering
- **Favorites** (`/favorites`): User's favorited submissions
- **Profile** (`/profile/[userId]`): Public profile pages with portfolio and submissions
- **Profile Edit** (`/profile/edit`): Manage profile, bio, social links, and portfolio
- **Submission Detail** (`/s/[id]`): Individual submission view with sharing

### Admin Features

- **Admin Dashboard** (`/admin`): Manage prompts, view users, and moderate content
- **Prompt Management**: Create, edit, and delete weekly prompts
- **User Management**: View and manage user accounts

### Technical Components

- **API Routes**: RESTful endpoints for all data operations. See [Architecture Documentation](apps/web/docs/ARCHITECTURE.md#api-routes)
- **Image Storage**: Direct browser uploads to Cloudflare R2 via presigned URLs. See [Database Documentation - Image Storage](apps/web/docs/DATABASE.md#image-storage-cloudflare-r2)
- **Authentication**: Google OAuth integration with NextAuth.js
- **Frontend Components**: Reusable React components with dark mode support. See [Frontend Documentation](apps/web/docs/FRONTEND.md)

For detailed information about each part, see:
- [Architecture Documentation](apps/web/docs/ARCHITECTURE.md) - System architecture and design decisions
- [Database Documentation](apps/web/docs/DATABASE.md) - Schema, models, and data patterns
- [Frontend Documentation](apps/web/docs/FRONTEND.md) - React components, theming, and UI patterns
- [AGENTS.md](AGENTS.md) - Developer guide with coding standards and common tasks

## Developer Setup

### Prerequisites

- **Bun** (v1.0+): Package manager and runtime
- **PostgreSQL**: Database (local or remote)
- **Node.js** (v18+): Required for some tooling

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd prompt
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

   The Next.js app lives in `apps/web`. You can run app-specific scripts with:
   ```bash
   bun --cwd apps/web run <script>
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_URL`: App URL (http://localhost:3000 for dev)
   - `NEXTAUTH_SECRET`: Random secret for NextAuth
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`: Cloudflare R2 configuration

4. **Run database migrations**
   ```bash
   bunx prisma migrate dev --schema apps/web/prisma/schema.prisma
   ```

5. **Start the development server**
   ```bash
   bun run dev
   ```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run oxlint |
| `bun run format` | Format code with Biome |
| `bun run format:check` | Check formatting without changes |

### Development Tools

- **Prisma Studio**: Visual database browser
  ```bash
  bunx prisma studio
  ```

- **Database Migrations**: Create and apply migrations
  ```bash
  bunx prisma migrate dev --name <description>
  ```

For more detailed setup instructions and development patterns, see [AGENTS.md](AGENTS.md).

## Contributing

We welcome contributions! Here are some guidelines:

### Code Standards

- **TypeScript**: Use strict typing, avoid `any`
- **React**: Prefer Server Components by default, use Client Components only when needed
- **Styling**: Use Tailwind CSS with dark mode variants (`dark:` prefix)
- **Formatting**: Code is automatically formatted with Biome (2 spaces, double quotes, semicolons)
- **Linting**: Run `bun run lint` before committing

### Development Workflow

1. **Create a branch** for your feature or fix
2. **Follow coding standards** (see [AGENTS.md](AGENTS.md#coding-standards))
3. **Test your changes** locally
4. **Format code** with `bun run format`
5. **Check linting** with `bun run lint`
6. **Submit a pull request** with a clear description

### Key Patterns to Follow

- **Server Components**: Use for data fetching and static content
- **Client Components**: Use only for interactive UI, hooks, or browser APIs
- **API Routes**: Always validate authentication with `auth()`
- **Database Access**: Import prisma from `@/lib/prisma`
- **Error Handling**: Return appropriate HTTP status codes and error messages

### Documentation

When adding new features:
- Update relevant documentation in `apps/web/docs/`
- Add code comments for complex logic
- Update this README if adding new major features

For detailed coding standards and patterns, see:
- [AGENTS.md](AGENTS.md) - Complete developer guide
- [apps/web/docs/ARCHITECTURE.md](apps/web/docs/ARCHITECTURE.md) - System architecture
- [apps/web/docs/DATABASE.md](apps/web/docs/DATABASE.md) - Database patterns
- [apps/web/docs/FRONTEND.md](apps/web/docs/FRONTEND.md) - Frontend patterns

### Questions?

If you have questions about the codebase or need help getting started, please open an issue or reach out to the maintainers.
