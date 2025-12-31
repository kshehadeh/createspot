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
├── auth/               # Authentication pages
├── history/            # User submission history
├── play/               # Submission creation
├── this-week/          # Gallery view
└── api/                # API routes

components/
├── animated-home.tsx   # Animated landing page components
├── auth-button.tsx     # Sign in/out buttons
├── confirm-modal.tsx   # Reusable confirmation dialog
├── header.tsx          # App header with navigation
└── logo.tsx            # SVG logo component
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

// Client Component - components/animated-home.tsx
"use client";
import { motion } from "framer-motion";
export function AnimatedHero() { ... }
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
  <Link href="/gallery">Gallery</Link>
  <Link href="/play">Play</Link>
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

## Best Practices

1. **Prefer Server Components** for data fetching and static content
2. **Use `"use client"`** only when needed (hooks, interactivity, browser APIs)
3. **Co-locate components** with their routes when page-specific
4. **Extract to `/components`** when reused across pages
5. **Use Tailwind's dark: variant** consistently for dark mode
6. **Follow the zinc color scale** for consistent neutral colors
7. **Use motion sparingly** - entrance animations and hover states only
