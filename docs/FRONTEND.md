# Frontend Architecture

This document covers the React component architecture, theming system, and UI patterns used in the application.

> **Note**: This app uses **shadcn/ui** for accessible, theme-aware components. Most UI components are built on shadcn primitives located in `components/ui/`. The theme system uses **next-themes** for user-controllable dark/light mode.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Accessible component primitives (Radix UI)
- **next-themes** - Theme management with user toggle
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
├── ui/                      # shadcn/ui components
│   ├── button.tsx          # Button component
│   ├── dialog.tsx          # Dialog/Modal component
│   ├── dropdown-menu.tsx   # Dropdown menu component
│   ├── input.tsx          # Input field component
│   ├── select.tsx         # Select dropdown component
│   ├── label.tsx          # Form label component
│   ├── avatar.tsx         # Avatar component
│   ├── badge.tsx          # Badge component
│   ├── tabs.tsx           # Tabs component
│   ├── alert-dialog.tsx   # Alert dialog component
│   └── ...                # Other shadcn components
├── auth-button.tsx          # Sign in/out buttons
├── confirm-modal.tsx        # Reusable confirmation dialog (uses AlertDialog)
├── expandable-image.tsx     # Image viewer with expand functionality (uses Dialog)
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
├── submission-lightbox.tsx  # Full-screen submission viewer (uses Dialog)
├── theme-provider.tsx        # Theme provider wrapper (next-themes)
├── theme-toggle.tsx          # Theme toggle button
└── text-thumbnail.tsx        # Text preview thumbnail
```

## Theme System

The app uses **next-themes** for theme management with user-controllable dark/light mode. Users can toggle themes via the theme toggle button in the header.

### Theme Provider

The root layout wraps the app with `ThemeProvider`:

```tsx
// app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider";

<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

### CSS Variables

The app uses shadcn/ui's CSS variable system for theming, defined in `app/globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    /* ... more variables */
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    /* ... dark mode variables */
  }
}
```

Variables use HSL format and are applied via `hsl(var(--variable))` in Tailwind.

### Using Theme Variables

shadcn components automatically use theme variables. You can also use them in custom components:

```tsx
// Theme-aware styling
<div className="bg-background text-foreground">
  <Button variant="default">Themed Button</Button>
</div>

// Custom dark mode styles (when needed)
<div className="bg-white dark:bg-zinc-900">
  <p className="text-zinc-900 dark:text-white">Content</p>
</div>
```

### Color Palette

The app uses shadcn's zinc-based color system:

| Usage | Light Mode | Dark Mode |
|-------|------------|-----------|
| Background | `bg-background` | `bg-background` (auto) |
| Card/Surface | `bg-card` | `bg-card` (auto) |
| Border | `border-border` | `border-border` (auto) |
| Primary Text | `text-foreground` | `text-foreground` (auto) |
| Secondary Text | `text-muted-foreground` | `text-muted-foreground` (auto) |

### Theme Toggle

Users can toggle themes via the `ThemeToggle` component in the header:

```tsx
import { ThemeToggle } from "@/components/theme-toggle";

<ThemeToggle />
```

The toggle cycles between:
- **Light** - Force light mode
- **Dark** - Force dark mode  
- **System** - Follow system preference (default)

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
2. Theme provider (next-themes)
3. NextAuth `SessionProvider`
4. Global styles

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Note: `suppressHydrationWarning` is required on the `<html>` tag when using next-themes to prevent hydration warnings.

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

### shadcn/ui Components

The app uses shadcn/ui for accessible, theme-aware components. All components are in `components/ui/` and can be imported directly.

#### Common Components

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Button variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// Form inputs
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" placeholder="Enter email" />

// Select dropdown
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>

// Dialog/Modal
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <p>Dialog content</p>
  </DialogContent>
</Dialog>
```

#### Adding New shadcn Components

```bash
bunx shadcn@latest add <component-name>
```

This installs the component to `components/ui/` with all necessary dependencies.

### ConfirmModal

Accessible confirmation dialog built on shadcn's AlertDialog.

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
- Built on shadcn AlertDialog
- Theme-aware styling
- Focus trap
- Escape key handling
- Loading state

### Auth Buttons

Pre-styled authentication buttons using NextAuth and shadcn Button.

```tsx
import { SignInButton } from "@/components/auth-button";

<SignInButton />  // "Sign in with Google" - uses shadcn Button
```

### Migrated Components

Several components have been migrated to use shadcn/ui primitives:

- **ConfirmModal** → Uses `AlertDialog`
- **UserDropdown** → Uses `DropdownMenu` + `Avatar`
- **AdminDropdown, ExhibitionsDropdown, PromptsDropdown** → Use `DropdownMenu`
- **ExpandableImage** → Uses `Dialog`
- **SubmissionLightbox** → Uses `Dialog` + `Tabs` + `Badge` + `Avatar`
- **AuthButton** → Uses `Button`
- **Form components** → Use `Input`, `Select`, `Label`, `Button`

All migrated components maintain backward compatibility with their original prop interfaces.
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

### Using shadcn Form Components

Forms should use shadcn/ui components for consistent, accessible, theme-aware styling:

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const [formData, setFormData] = useState({ title: "", category: "" });

// Text input with label
<Label htmlFor="title">Title</Label>
<Input
  id="title"
  value={formData.title}
  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
/>

// Select dropdown
<Label htmlFor="category">Category</Label>
<Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
  <SelectTrigger id="category">
    <SelectValue placeholder="Select category" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="art">Art</SelectItem>
    <SelectItem value="writing">Writing</SelectItem>
  </SelectContent>
</Select>

// Buttons
<Button type="submit" variant="default">Submit</Button>
<Button type="button" variant="outline">Cancel</Button>
<Button type="button" variant="destructive">Delete</Button>
```

### Controlled Inputs

Forms use React state for controlled inputs. shadcn components work seamlessly with controlled inputs:

```tsx
const [email, setEmail] = useState("");

<Input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Enter email"
/>
```

### Form Validation Styling

For validation states, use conditional classes with shadcn components:

```tsx
import { cn } from "@/lib/utils";

<Input
  className={cn(
    "w-full",
    hasError && "border-destructive focus:border-destructive focus:ring-destructive"
  )}
/>
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
