# Frontend Architecture

This document covers the React component architecture, theming system, and UI patterns used in the application.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **NextAuth.js** - Authentication

## Project Structure

```
app/
├── layout.tsx          # Root layout with providers
├── page.tsx            # Home page
├── globals.css         # Global styles & theme tokens
├── admin/              # Admin pages (prompt management, users)
├── api/                # API routes
├── auth/               # Authentication pages
├── exhibition/         # Exhibition pages
│   ├── gallery/        # Gallery view
│   └── constellation/  # Constellation view
├── favorites/          # User favorites page
├── prompt/             # Prompt-related pages
│   ├── history/        # User submission history
│   ├── play/           # Submission creation
│   └── this-week/      # Gallery view
├── profile/            # User profile pages
│   ├── [userId]/       # Public profile view
│   └── edit/           # Profile editing
└── s/                  # Submission detail pages
    └── [id]/           # Individual submission view

components/
├── auth-button.tsx          # Sign in/out buttons
├── confirm-modal.tsx        # Reusable confirmation dialog
├── expandable-image.tsx     # Image viewer with expand functionality
├── expandable-text.tsx      # Text viewer with expand functionality
├── favorite-button.tsx      # Favorite/unfavorite button
├── favorites-provider.tsx   # Context provider for favorites state
├── header.tsx               # App header with navigation
├── logo.tsx                 # SVG logo component
├── portfolio-grid.tsx       # Grid display for portfolio items
├── portfolio-item-form.tsx  # Form for creating/editing portfolio items
├── profile-analytics.tsx    # Analytics display component
├── profile-view-tracker.tsx # Client component for tracking profile views
├── rich-text-editor.tsx     # TipTap-based rich text editor
├── share-button.tsx         # Share submission button
├── submission-lightbox.tsx  # Full-screen submission viewer
└── text-thumbnail.tsx       # Text preview thumbnail
```

## Theme System

### CSS Variables

The app uses CSS custom properties for theming, defined in `app/globals.css`:

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

### Tailwind Theme Tokens

Theme tokens are exposed to Tailwind via `@theme inline`:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

This allows using tokens in Tailwind classes:

```tsx
<div className="bg-background text-foreground" />
<button className="bg-foreground text-background" />
```

### Color Palette

The app primarily uses Tailwind's `zinc` scale for a neutral, modern look:

| Usage | Light Mode | Dark Mode |
|-------|------------|-----------|
| Background | `bg-zinc-50` | `bg-black` |
| Card/Surface | `bg-white` | `bg-zinc-900` |
| Border | `border-zinc-200` | `border-zinc-800` |
| Primary Text | `text-zinc-900` | `text-white` |
| Secondary Text | `text-zinc-600` | `text-zinc-400` |
| Muted Text | `text-zinc-500` | `text-zinc-400` |

### Dark Mode

Dark mode is automatic based on system preference (`prefers-color-scheme: dark`). Use Tailwind's `dark:` variant for dark mode styles:

```tsx
<div className="bg-white dark:bg-zinc-900">
  <p className="text-zinc-900 dark:text-white">Content</p>
</div>
```

### Typography

Two fonts are loaded via `next/font/google`:

- **Geist Sans** (`--font-geist-sans`) - Primary font
- **Geist Mono** (`--font-geist-mono`) - Code/monospace

Applied in the root layout:

```tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
```

## Component Patterns

### Server vs Client Components

The app follows Next.js 13+ conventions:

- **Server Components** (default): Pages, data fetching, static content
- **Client Components** (`"use client"`): Interactive UI, hooks, browser APIs

```tsx
// Server Component (default) - app/page.tsx
export default async function Home() {
  const data = await fetchData(); // Server-side data fetching
  return <ClientComponent data={data} />;
}

// Client Component - components/example.tsx
"use client";
import { motion } from "framer-motion";
export function ExampleComponent() { ... }
```

### Layout Pattern

The root layout provides:
1. Font CSS variables
2. NextAuth `SessionProvider`
3. Global styles

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

### Page Structure

Pages follow a consistent structure:

```tsx
<div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
  <Header user={session?.user}>
    {/* Navigation links */}
  </Header>
  
  <main className="flex flex-1 flex-col items-center px-6 py-16">
    {/* Page content */}
  </main>
  
  <footer className="px-6 py-8 text-center text-sm text-zinc-500">
    {/* Footer content */}
  </footer>
</div>
```

## Core Components

### Header

Reusable header with logo, title breadcrumb, navigation, and user avatar.

```tsx
import { Header } from "@/components/header";

<Header 
  title="Play"           // Optional breadcrumb
  user={session?.user}   // Shows avatar if logged in
>
  <Link href="/exhibition/gallery">Gallery</Link>
  <Link href="/prompt/play">Play</Link>
</Header>
```

**Props:**
- `title?: string` - Page title shown as breadcrumb
- `children?: ReactNode` - Navigation links
- `user?: { name?: string; image?: string }` - User info for avatar

### ConfirmModal

Accessible confirmation dialog with keyboard support (Escape to close).

```tsx
import { ConfirmModal } from "@/components/confirm-modal";

<ConfirmModal
  isOpen={showModal}
  title="Delete submission?"
  message="This action cannot be undone."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  onConfirm={handleDelete}
  onCancel={() => setShowModal(false)}
  isLoading={isDeleting}
/>
```

**Features:**
- Backdrop blur overlay
- Focus trap
- Escape key handling
- Loading state

### Auth Buttons

Pre-styled authentication buttons using NextAuth.

```tsx
import { SignInButton, SignOutButton } from "@/components/auth-button";

<SignInButton />  // "Sign in with Google"
<SignOutButton /> // "Sign out"
```

## Animation Patterns

### Framer Motion

The app uses Framer Motion for smooth animations. Key patterns:

**Staggered entrance:**
```tsx
{words.map((word, index) => (
  <motion.span
    key={index}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: index * 0.15 }}
  >
    {word}
  </motion.span>
))}
```

**Hover interactions:**
```tsx
<motion.div
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.98 }}
>
  {content}
</motion.div>
```

### CSS Animations

Custom animations defined in `globals.css`:

```css
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 10px 2px rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 20px 6px rgba(59, 130, 246, 0.7);
  }
}

.animate-glow-pulse {
  animation: glow-pulse 0.5s ease-in-out 4;
}
```

Usage:
```tsx
<section className={showHighlight ? "animate-glow-pulse" : ""}>
```

## Form Patterns

### Controlled Inputs

Forms use React state for controlled inputs:

```tsx
const [formData, setFormData] = useState({ title: "", text: "" });

<input
  value={formData.title}
  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
  className="w-full rounded-lg border border-zinc-300 px-4 py-2 ..."
/>
```

### Form Styling

Consistent form element styles:

```tsx
// Text input
<input className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 
  text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 
  focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />

// Primary button
<button className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium 
  text-white hover:bg-zinc-700 disabled:opacity-50 
  dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200" />

// Secondary button
<button className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm 
  font-medium text-zinc-700 hover:bg-zinc-50 
  dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800" />
```

### Loading States

Buttons show loading state with disabled styling:

```tsx
<button disabled={isLoading} className="... disabled:opacity-50">
  {isLoading ? "Saving..." : "Save"}
</button>
```

### Error Display

Errors shown in styled alert boxes:

```tsx
{error && (
  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 
    dark:bg-red-900/20 dark:text-red-400">
    {error}
  </div>
)}
```

## Modal Pattern

Modals use a portal-like pattern with fixed positioning:

```tsx
{isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Backdrop */}
    <div 
      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    />
    
    {/* Modal content */}
    <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 
      dark:bg-zinc-900">
      {/* Content */}
    </div>
  </div>
)}
```

## Responsive Design

The app uses Tailwind's responsive prefixes:

```tsx
// Mobile-first approach
<div className="px-6 sm:px-12">           {/* Padding increases on sm+ */}
<div className="grid-cols-2 sm:grid-cols-3"> {/* Columns increase on sm+ */}
<span className="hidden sm:inline">         {/* Hidden on mobile */}
<span className="text-4xl sm:text-6xl">     {/* Font size scales up */}
```

## Data Fetching

### Server Components

Use async/await directly in server components:

```tsx
export default async function Page() {
  const session = await auth();
  const data = await prisma.prompt.findMany();
  
  return <ClientComponent data={data} />;
}
```

### Client Components

Use fetch with useEffect or form submissions:

```tsx
async function handleSubmit() {
  const response = await fetch("/api/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error);
  }
  
  router.refresh(); // Revalidate server components
}
```

### Route Revalidation

After mutations, call `router.refresh()` to revalidate server component data:

```tsx
import { useRouter } from "next/navigation";

const router = useRouter();
// After successful mutation:
router.refresh();
```

## Portfolio Components

### PortfolioGrid

Displays a grid of portfolio items with category filtering:

```tsx
import { PortfolioGrid } from "@/components/portfolio-grid";

<PortfolioGrid
  items={portfolioItems}
  isLoggedIn={!!session}
  isOwnProfile={isOwnProfile}
  showPromptBadge={true}
/>
```

**Props:**
- `items`: Array of portfolio items with `id`, `title`, `imageUrl`, `text`, `tags`, `category`, etc.
- `isLoggedIn`: Whether user is authenticated (for favorite buttons)
- `isOwnProfile`: Whether viewing own profile (for empty state)
- `showPromptBadge`: Whether to show prompt badges on items linked to prompts

**Features:**
- Category filtering (if items have categories)
- Responsive grid layout (2 cols mobile, 3 cols desktop)
- Favorite button integration
- Click to view full submission

### PortfolioItemForm

Form for creating or editing portfolio items:

```tsx
import { PortfolioItemForm } from "@/components/portfolio-item-form";

<PortfolioItemForm
  mode="create"  // or "edit"
  initialData={existingItem}  // For edit mode
  onSuccess={() => router.refresh()}
  onCancel={() => setShowForm(false)}
/>
```

**Features:**
- Image upload with preview
- Rich text editor for descriptions
- Category selection
- Tag input (comma-separated)
- Title field (optional)
- Share status selector (visibility control)

**Share Status Options:**
- **Public** (default) - Visible everywhere (galleries, profile pages, etc.)
- **Profile Only** - Only visible on your profile page
- **Private** - Only visible to you

The share status selector is displayed as radio buttons with descriptions for each option.

### ProfileAnalytics

Displays analytics for profile owners:

```tsx
import { ProfileAnalytics } from "@/components/profile-analytics";

<ProfileAnalytics userId={user.id} />
```

**Displays:**
- Profile Views (unique visitors)
- Total Favorites (across all submissions)
- Work Views (total submission views)
- Total Works (all submissions count)

**Note:** Only visible to profile owner.

### ProfileViewTracker

Client component that tracks profile views:

```tsx
import { ProfileViewTracker } from "@/components/profile-view-tracker";

<ProfileViewTracker profileUserId={user.id} />
```

**Behavior:**
- Automatically tracks view on mount
- Only tracks for non-owners
- Uses hashed IP for anonymous users
- Silently fails if tracking unavailable

## Profile Pages

### Public Profile (`/profile/[userId]`)

Displays user's public portfolio and prompt submissions:

**Sections:**
1. **Header**: Avatar, name, bio, social links
2. **Analytics** (own profile only): Profile views, favorites, work views
3. **Featured Submission**: Highlighted work (if set)
4. **Portfolio**: Grid of portfolio items
5. **Prompt Submissions**: History of prompt submissions

### Profile Edit (`/profile/edit`)

Two-tab interface for managing profile:

**Profile Tab:**
- Bio editor (rich text)
- Social links (Instagram, Twitter, LinkedIn, Website)
- Featured submission selector

**Portfolio Tab:**
- Add new portfolio items
- Edit existing portfolio items
- Delete portfolio items
- Add prompt submissions to portfolio

## Portfolio Patterns

### Creating Portfolio Items

```tsx
const response = await fetch("/api/submissions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "My Artwork",
    imageUrl: uploadedUrl,
    text: "<p>Description</p>",
    isPortfolio: true,
    tags: ["photography", "nature"],
    category: "Photography",
    shareStatus: "PUBLIC"  // or "PROFILE" or "PRIVATE"
  }),
});
```

**Share Status Values:**
- `"PUBLIC"` - Visible everywhere (galleries, profile pages, etc.)
- `"PROFILE"` - Only visible on your profile page
- `"PRIVATE"` - Only visible to you

### Linking Portfolio to Prompt

```tsx
// On Play page - use existing portfolio item
const response = await fetch(`/api/submissions/${portfolioItemId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    promptId: currentPrompt.id,
    wordIndex: 1  // 1, 2, or 3
  }),
});
```

**Note:** When linking a portfolio item to a prompt, the share status is automatically set to `PUBLIC`.

### Adding Prompt Submission to Portfolio

```tsx
const response = await fetch(`/api/submissions/${submissionId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    isPortfolio: true,
    tags: ["landscape"],
    category: "Photography"
  }),
});
```

## Best Practices

1. **Prefer Server Components** for data fetching and static content
2. **Use `"use client"`** only when needed (hooks, interactivity, browser APIs)
3. **Co-locate components** with their routes when page-specific
4. **Extract to `/components`** when reused across pages
5. **Use Tailwind's dark: variant** consistently for dark mode
6. **Follow the zinc color scale** for consistent neutral colors
7. **Use motion sparingly** - entrance animations and hover states only
8. **Track views client-side** - Use `ProfileViewTracker` for non-blocking analytics
9. **Handle nullable fields** - Portfolio items may not have `promptId` or `wordIndex`
