# System Architecture

This document provides an overview of the overall architecture of the Prompts application.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Next.js    │  │   React 19   │  │ Tailwind CSS │     │
│  │  App Router  │  │  Components  │  │     4        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   API Routes │  │   Server     │  │   Client     │     │
│  │  (Next.js)   │  │ Components   │  │ Components   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Prisma     │  │  NextAuth.js │  │  Cloudflare  │     │
│  │     ORM      │  │   (Auth)     │  │      R2      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  PostgreSQL  │  │  Cloudflare  │                        │
│  │  Database    │  │      R2      │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Application Layers

### 1. Client Layer

**Technologies:**
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Framer Motion

**Responsibilities:**
- User interface rendering
- Client-side interactivity
- Form handling
- Client-side routing
- Animation and transitions

**Key Patterns:**
- Server Components by default
- Client Components only when needed (`"use client"`)
- Progressive enhancement
- Responsive design (mobile-first)

### 2. Application Layer

#### API Routes (`app/api/`)

RESTful API endpoints for data operations:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth.js authentication |
| `/api/prompts` | GET/POST/PUT/DELETE | Prompt management |
| `/api/submissions` | GET/POST/DELETE | Submission CRUD |
| `/api/submissions/[id]` | GET/PUT/DELETE | Individual submission operations |
| `/api/submissions/[id]/view` | POST | Track submission view |
| `/api/profile` | GET/PUT | Profile management |
| `/api/profile/analytics` | GET | Profile analytics |
| `/api/profile/view` | POST | Track profile view |
| `/api/upload/presign` | POST | Get presigned URL for R2 |
| `/api/upload/delete` | POST | Delete image from R2 |
| `/api/favorites` | GET/POST/DELETE | Favorite management |
| `/api/history` | GET | User submission history |
| `/api/users` | GET | User listing (admin) |

**Authentication:**
- All protected routes use `auth()` from `@/lib/auth`
- Returns 401 for unauthenticated requests
- Admin routes check `session.user.isAdmin`

#### Server Components

**Responsibilities:**
- Data fetching from database
- Server-side rendering
- SEO optimization
- Initial page load performance

**Examples:**
- `app/page.tsx` - Home page with current prompt
- `app/profile/[userId]/page.tsx` - Public profile
- `app/this-week/page.tsx` - Gallery view

#### Client Components

**Responsibilities:**
- Interactive UI elements
- Form state management
- Client-side data fetching
- Real-time updates

**Examples:**
- `components/portfolio-item-form.tsx` - Form with file upload
- `components/profile-analytics.tsx` - Analytics display
- `app/play/submission-slots.tsx` - Submission interface

### 3. Service Layer

#### Prisma ORM

**Purpose:** Type-safe database access

**Key Features:**
- Connection pooling (via `@prisma/adapter-pg`)
- Type generation from schema
- Migration management
- Query builder

**Usage:**
```typescript
import { prisma } from "@/lib/prisma";

const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { submissions: true },
});
```

#### NextAuth.js

**Purpose:** Authentication and session management

**Provider:** Google OAuth

**Features:**
- OAuth 2.0 flow
- Session management
- User database integration
- Type-safe session types

**Usage:**
```typescript
import { auth } from "@/lib/auth";

const session = await auth();
if (!session?.user) {
  // Handle unauthenticated
}
```

#### Cloudflare R2

**Purpose:** Image storage

**Architecture:**
- Direct browser uploads via presigned URLs
- Bypasses serverless function size limits
- Public CDN for image delivery

**Flow:**
1. Client requests presigned URL from `/api/upload/presign`
2. Server generates presigned PUT URL (5-minute expiry)
3. Client uploads directly to R2
4. Client saves public URL to database

### 4. Data Layer

#### PostgreSQL Database

**Schema Models:**
- `User` - User accounts and profiles
- `Prompt` - Weekly creative prompts
- `Submission` - User submissions (prompts + portfolio)
- `Favorite` - User favorites
- `ProfileView` - Profile view analytics
- `SubmissionView` - Submission view analytics
- `Account`, `Session`, `VerificationToken` - NextAuth models

**Key Relationships:**
- User → Submissions (one-to-many)
- User → Favorites (one-to-many)
- Prompt → Submissions (one-to-many)
- Submission → Prompt (many-to-one, nullable)
- User → Featured Submission (one-to-one)

#### Cloudflare R2

**Organization:**
```
bucket/
├── {userId}/
│   ├── {uuid}.jpeg
│   ├── {uuid}.png
│   └── ...
```

**Features:**
- Public read access
- Presigned URL uploads
- CORS configured for browser uploads

## Data Flow Patterns

### Submission Creation Flow

```
User Input → Client Component → API Route → Prisma → PostgreSQL
                ↓
         Image Upload → Presigned URL → R2
                ↓
         Save URL to Database
```

### Profile View Flow

```
Page Load → Server Component → Fetch User Data → Render
                ↓
         Client Component → Track View → API Route → Database
```

### Portfolio Item Linking Flow

```
Portfolio Item → Play Page → Select Item → API Update
                ↓
         Link to Prompt (set promptId + wordIndex)
                ↓
         Now appears in both portfolio and prompt submission
```

## Key Architectural Decisions

### 1. Unified Submission Model

**Decision:** Single `Submission` model handles both prompt submissions and portfolio items.

**Rationale:**
- Reduces complexity
- Enables cross-linking (portfolio ↔ prompts)
- Single source of truth for user work
- Easier to query and manage

**Implementation:**
- `promptId` and `wordIndex` are nullable
- `isPortfolio` flag indicates portfolio display
- Items can have both (portfolio + prompt submission)

### 2. Direct R2 Uploads

**Decision:** Browser uploads directly to R2 using presigned URLs.

**Rationale:**
- Avoids serverless function payload limits (4.5MB → 10MB)
- Reduces server load
- Faster uploads (direct to storage)
- Better scalability

**Trade-offs:**
- Requires CORS configuration
- More complex error handling
- Client-side validation needed

### 3. Server Components by Default

**Decision:** Use Server Components unless client features are needed.

**Rationale:**
- Better performance (less JavaScript)
- Automatic code splitting
- Better SEO
- Simpler data fetching

**When to use Client Components:**
- Forms with state
- Interactive UI (modals, dropdowns)
- Browser APIs (localStorage, etc.)
- Real-time updates

### 4. View Tracking with IP Hashing

**Decision:** Hash IP addresses before storing for privacy.

**Rationale:**
- Protects user privacy
- Still enables unique visitor tracking
- GDPR-friendly approach
- Prevents IP-based user identification

**Implementation:**
- SHA-256 hashing
- Separate tracking for logged-in vs anonymous
- Unique constraints prevent duplicates

### 5. Analytics as Client-Side Feature

**Decision:** Analytics tracking happens client-side, non-blocking.

**Rationale:**
- Doesn't slow down page loads
- Graceful degradation if tracking fails
- Better user experience
- Can be disabled client-side if needed

## Security Architecture

### Authentication

- **Provider:** Google OAuth 2.0
- **Session Management:** NextAuth.js with database sessions
- **Authorization:** Role-based (admin flag in User model)

### Data Protection

- **Input Validation:** Server-side validation on all API routes
- **SQL Injection:** Prevented by Prisma ORM (parameterized queries)
- **XSS Prevention:** HTML sanitization for user-generated content
- **CSRF Protection:** NextAuth.js built-in protection

### Privacy

- **IP Hashing:** SHA-256 before storage
- **Self-View Exclusion:** Users don't track their own views
- **Analytics Access:** Only profile owners can view their analytics

## Scalability Considerations

### Database

- **Indexes:** On frequently queried fields (`userId`, `promptId`, `isPortfolio`)
- **Connection Pooling:** Prisma adapter with pg Pool
- **Query Optimization:** Selective field fetching with `select`

### Storage

- **R2 CDN:** Fast global image delivery
- **File Organization:** User-based directory structure
- **Cleanup:** Automatic deletion when submissions removed

### Performance

- **Server Components:** Reduced client bundle size
- **Image Optimization:** Next.js Image component (when applicable)
- **Lazy Loading:** Client components loaded on demand
- **Caching:** Next.js automatic caching for static routes

## Deployment Architecture

### Production Stack

```
┌─────────────────┐
│   Vercel/Edge   │  ← Next.js App Router
└─────────────────┘
         │
         ├──→ PostgreSQL (managed database)
         │
         └──→ Cloudflare R2 (object storage)
```

### Environment Variables

- **Database:** `DATABASE_URL` (PostgreSQL connection string)
- **Auth:** `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, Google OAuth credentials
- **Storage:** R2 credentials and bucket configuration
- **Analytics:** Vercel Analytics (optional)

## Future Considerations

### Potential Enhancements

1. **Real-time Features:** WebSocket support for live updates
2. **Search:** Full-text search for submissions and portfolio items
3. **Notifications:** User notifications for favorites, comments
4. **Comments:** Discussion threads on submissions
5. **Collections:** User-curated collections of submissions
6. **Export:** Portfolio export functionality

### Scalability Improvements

1. **Caching Layer:** Redis for frequently accessed data
2. **CDN:** Additional CDN layer for static assets
3. **Database Replication:** Read replicas for analytics queries
4. **Image Processing:** On-the-fly image optimization
5. **Background Jobs:** Queue system for heavy operations

