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
├── opengraph-image.tsx # Default OG image
├── icon.tsx            # App icon
├── apple-icon.tsx      # Apple touch icon
├── about/              # About pages
│   ├── page.tsx
│   ├── purpose/
│   ├── prompt-submissions/
│   └── portfolios-and-sharing/
├── admin/              # Admin pages
│   ├── page.tsx
│   ├── prompts/        # Prompt management
│   ├── users/          # User management
│   └── exhibits/       # Exhibit management
│       ├── page.tsx
│       ├── new/
│       ├── [id]/
│       │   ├── edit/
│       │   └── content/
│       └── [components] # Exhibit-related components
├── api/                # API routes
│   ├── auth/           # NextAuth routes
│   ├── prompts/        # Prompt endpoints
│   ├── submissions/    # Submission CRUD
│   ├── favorites/      # Favorite management
│   ├── profile/        # Profile endpoints
│   ├── exhibition/     # Exhibition endpoints
│   ├── exhibits/       # Exhibit endpoints
│   ├── upload/         # Image upload
│   ├── users/          # User endpoints
│   └── admin/          # Admin endpoints
├── auth/
│   └── signin/         # Sign in page
├── creators/           # Creators directory page
│   └── page.tsx
├── exhibition/         # Exhibition pages
│   ├── page.tsx
│   ├── [exhibitId]/    # Individual exhibit
│   ├── gallery/        # Gallery views
│   │   ├── page.tsx
│   │   ├── [exhibitId]/
│   │   ├── grid/
│   │   └── path/
│   ├── constellation/  # Constellation view
│   └── global/         # Global exhibition
├── favorites/          # User favorites page
│   └── page.tsx
├── portfolio/          # Portfolio pages
│   ├── [userId]/       # Public portfolio view
│   └── edit/           # Portfolio editing
├── profile/            # User profile pages
│   ├── [userId]/       # Public profile view
│   └── edit/           # Profile editing
├── prompt/             # Prompt-related pages
│   ├── page.tsx
│   ├── history/        # User submission history
│   ├── play/           # Submission creation
│   └── this-week/      # Gallery view
├── s/                  # Submission detail pages
│   └── [id]/
│       ├── page.tsx
│       └── opengraph-image.tsx
└── terms/              # Terms of service
    └── page.tsx

components/
├── ui/                      # shadcn/ui components
│   ├── alert-dialog.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── popover.tsx
│   ├── select.tsx
│   ├── sonner.tsx          # Toast notifications
│   ├── switch.tsx
│   └── tooltip.tsx
├── breadcrumb.tsx           # Breadcrumb navigation
├── confirm-modal.tsx        # Reusable confirmation dialog
├── constellation-path.tsx   # Constellation path visualization
├── create-spot-logo.tsx     # Logo component
├── creators-filters.tsx     # Creator filtering
├── creators-grid.tsx        # Creators grid display
├── delete-account-modal.tsx # Account deletion modal
├── exhibit-view-selector.tsx # Exhibit view type selector
├── expandable-bio.tsx        # Expandable biography
├── expandable-text.tsx      # Text viewer with expand
├── favorite-button.tsx      # Favorite/unfavorite button
├── favorites-provider.tsx   # Context provider for favorites
├── featured-submission-selector.tsx # Featured submission picker
├── featured-submission.tsx  # Featured submission display
├── focal-point-modal.tsx    # Image focal point editor
├── header.tsx               # App header with navigation
├── image-lightbox.tsx       # Image lightbox viewer
├── mobile-navigation.tsx    # Mobile navigation menu
├── navigation-links.tsx     # Navigation links component
├── page-header.tsx          # Page header component
├── page-layout.tsx          # Page layout wrapper
├── portfolio-grid.tsx       # Grid display for portfolio items
├── portfolio-item-form.tsx # Form for creating/editing portfolio items
├── portfolio-share-button.tsx # Portfolio share button
├── profile-analytics.tsx    # Analytics display component
├── profile-image-modal.tsx  # Profile image upload modal
├── profile-image-viewer.tsx # Profile image viewer
├── profile-share-button.tsx # Profile share button
├── profile-view-tracker.tsx # Client component for tracking views
├── recent-submissions-carousel.tsx # Recent submissions carousel
├── rich-text-editor.tsx     # TipTap-based rich text editor
├── share-button.tsx         # Share submission button
├── submission-edit-modal.tsx # Submission editing modal
├── submission-image.tsx      # Submission image display
├── submission-lightbox.tsx  # Full-screen submission viewer
├── text-thumbnail.tsx        # Text preview thumbnail
├── theme-provider.tsx        # Theme provider wrapper (next-themes)
├── theme-toggle.tsx          # Theme toggle button
├── themed-card.tsx           # Theme-aware card component
├── user-dropdown.tsx          # User dropdown menu
├── user-selector.tsx         # User selection component
└── user-work-modal.tsx       # User work modal viewer
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

### iOS Safari Dark Mode Support

iOS Safari has a known issue where dark mode detection can fail for cards with gradient backgrounds. When using gradient backgrounds on cards, you must add explicit CSS rules with `!important` to ensure proper dark mode styling.

**Pattern for iOS Safari dark mode support:**

1. Create a specific CSS class for the card (e.g., `contact-card-blue`, `terms-card`)
2. Define the light mode gradient background
3. Add `.dark` class rule with `!important`
4. Add `@media (prefers-color-scheme: dark)` rule with `!important` for iOS Safari

**Example from `app/globals.css`:**

```css
/* Contact page card styling with iOS Safari dark mode support */
.contact-card-blue {
  background: linear-gradient(to bottom right, rgb(239 246 255 / 0.5), rgb(255 255 255)) !important;
}

.dark .contact-card-blue {
  background: hsl(240 10% 3.9%) !important;
}

@media (prefers-color-scheme: dark) {
  .contact-card-blue:not(.light .contact-card-blue) {
    background: hsl(240 10% 3.9%) !important;
  }
}
```

**Usage in components:**

```tsx
<Card className="contact-card-blue rounded-3xl border-none shadow-sm">
  <CardContent>...</CardContent>
</Card>
```

**Important notes:**
- Always use `!important` to override Tailwind classes
- Use the card background color `hsl(240 10% 3.9%)` for dark mode
- The `@media (prefers-color-scheme: dark)` rule is critical for iOS Safari
- Apply this pattern to any card with custom gradient backgrounds

**Pages using this pattern:**
- `/contact` - `contact-card-blue`, `contact-card-purple`
- `/terms` - `terms-card`

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
  <Link href="/exhibition/gallery">Grid</Link>
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

### SubmissionLightbox

Full-screen lightbox component for viewing submissions with responsive layouts that adapt based on screen size and content type.

**Location:** `components/submission-lightbox.tsx`

**Props:**
- `submission`: Submission object with `id`, `title`, `imageUrl`, `text`, `user`, `_count`
- `word`: The prompt word for this submission
- `onClose`: Callback when lightbox is closed
- `isOpen`: Boolean to control visibility
- `hideGoToSubmission?`: Hide the "View Submission" button (default: false)
- `protectionEnabled?`: Enable download protection (default: true)

**Features:**
- Responsive layout with sidebar on large screens (xl+, 1280px+)
- Image zoom functionality with preview window
- Text content display in sidebar or overlay
- Metadata display (title, user, favorites)
- Tooltips on all buttons
- Theme-aware styling

#### Layout Structure

The lightbox adapts its layout based on screen size and content:

**Breakpoint:** `xl` (1280px) - Sidebar appears on screens >= 1280px wide

##### Desktop with Sidebar (xl+, >= 1280px)

When the sidebar is visible, the layout uses a two-column structure:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lightbox Container (Full Screen)             │
├──────────────────────────────────────┬──────────────────────────┤
│                                      │                          │
│         Main Area (flex-1)           │   Sidebar (400px)        │
│                                      │                          │
│         ┌──────────────┐            │   ┌──────────────────┐   │
│         │              │            │   │  Zoom Preview    │   │
│         │    Image     │            │   │  (when hovering) │   │
│         │  (centered,  │            │   └──────────────────┘   │
│         │  zoomable)   │            │                          │
│         │              │            │   ┌──────────────────┐   │
│         │              │            │   │                  │   │
│         └──────────────┘            │   │  Text Content   │   │
│                                      │   │  (scrollable)   │   │
│                                      │   │                  │   │
│                                      │   └──────────────────┘   │
│                                      │                          │
├──────────────────────────────────────┴──────────────────────────┤
│                                                          [Buttons]│
│                                                          (lower   │
│                                                           right)  │
└─────────────────────────────────────────────────────────────────┘
```

**Layout Details:**
- **Main area**: Image fills the left side, centered and zoomable
- **Sidebar (right)**: Fixed 400px width containing:
  - Zoom preview window near the top (only visible when actively zooming)
  - Text content below zoom window (when text exists)
- **Buttons**: Full buttons with text in lower right corner
- **Metadata**: Hidden (title shown in sidebar instead)

##### Desktop without Sidebar (< xl, < 1280px)

On smaller desktop screens, buttons and zoom overlay the image:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lightbox Container (Full Screen)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         Main Area (full width)                                 │
│                                                                 │
│    ┌──────────┐                                                │
│    │  Zoom    │                                                │
│    │ Preview  │    ┌──────────────┐                           │
│    │(overlay) │    │              │                           │
│    └──────────┘    │    Image     │                           │
│                    │  (centered,  │                           │
│                    │  zoomable)   │                           │
│                    │              │                           │
│                    └──────────────┘                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [Metadata]                                              [Icon   │
│ (title, user,                                           Buttons]│
│ favorites)                                              (lower  │
│ (lower left)                                            right)  │
└─────────────────────────────────────────────────────────────────┘
```

**Layout Details:**
- **Main area**: Image fills the space, centered and zoomable
- **Zoom preview**: Overlays the image in top-left corner
- **Buttons**: Icon-only buttons in lower right corner (includes "View Text" icon when text exists)
- **Metadata**: Title, user, and favorites in lower left corner

##### Text-Only Layout

When there's only text (no image), the text occupies the main area:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lightbox Container (Full Screen)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         Main Area (full width)                                 │
│                                                                 │
│                    ┌──────────────────────┐                    │
│                    │                      │                    │
│                    │   Text Content      │                    │
│                    │   (centered,        │                    │
│                    │    scrollable)      │                    │
│                    │                      │                    │
│                    └──────────────────────┘                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [Metadata]                                              [Buttons]│
│ (user,                                                (lower    │
│ favorites)                                            right)    │
│ (lower left)                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Layout Details:**
- **Main area**: Text content centered and scrollable
- **Buttons**: Full buttons on xl+, icon-only on smaller screens
- **Metadata**: User and favorites in lower left corner

##### Mobile Layout

On mobile devices, the layout is simplified:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lightbox Container (Full Screen)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         Main Area (full width)                                 │
│                                                                 │
│                    ┌──────────────┐                             │
│                    │              │                             │
│                    │    Image     │  (when image exists)        │
│                    │   or Text    │  (when text only)           │
│                    │              │                             │
│                    └──────────────┘                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [Metadata]                                              [Icon   │
│ (title, user,                                           Buttons]│
│ favorites)                                              (lower  │
│ (lower left)                                            right)  │
└─────────────────────────────────────────────────────────────────┘
```

**Layout Details:**
- **Main area**: Image or text fills the space
- **Buttons**: Icon-only buttons in lower right corner
- **Metadata**: Title, user, and favorites in lower left corner (when image exists)

#### Zoom Functionality

The lightbox includes image zoom functionality:

- **Hover to zoom**: Move mouse over image to see zoom preview
- **Zoom square**: 200px square overlay on image showing zoom area
- **Zoom preview**: 400px preview window showing magnified area (2x zoom)
- **Sidebar mode**: Zoom preview appears in sidebar near top (xl+)
- **Overlay mode**: Zoom preview overlays image in top-left (< xl)

**Requirements:**
- Image must be at least 200px in both dimensions
- Only works on devices that support hover (not touch devices)

#### Button Layout

All buttons are positioned in the lower right corner:

**On xl+ screens:**
- Full buttons with text labels
- "View Submission" button (if not hidden)
- "Close" button

**On < xl screens (including mobile):**
- Icon-only buttons
- "View Text" icon button (when text exists and image present)
- "View Submission" icon button (if not hidden)
- "Close" icon button

All buttons have tooltips for clarity.

#### Usage Example

```tsx
import { SubmissionLightbox } from "@/components/submission-lightbox";

const [isOpen, setIsOpen] = useState(false);

<SubmissionLightbox
  submission={{
    id: "123",
    title: "My Submission",
    imageUrl: "https://...",
    text: "<p>Description</p>",
    user: { id: "user1", name: "John Doe" },
    _count: { favorites: 5 }
  }}
  word="inspiration"
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  hideGoToSubmission={false}
  protectionEnabled={true}
/>
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

## Link Patterns

### Mini-Actions (Arrow Links)

Use **mini-action links** for navigation to related areas within the site. These are styled as text links with arrows (→) to indicate they take you somewhere related, as opposed to buttons which perform actions or open external resources.

**When to use mini-action links:**
- Navigating to a related page (e.g., "View Profile" from portfolio page)
- Links within overlays/lightboxes (e.g., "View Submission →", "View Text →")
- Secondary navigation that supplements the main content

**When NOT to use mini-action links:**
- Primary actions (use buttons instead)
- External links (use buttons or different styling)
- Destructive actions (use buttons with destructive variant)
- Form submissions (use buttons)

**Styling:**

```tsx
// Mini-action link pattern
<Link
  href={`/profile/${user.id}`}
  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
>
  View Profile →
</Link>

// On dark backgrounds (e.g., lightboxes)
<Link
  href={`/s/${submission.id}`}
  className="text-sm font-medium text-white/80 transition-colors hover:text-white"
>
  View Submission →
</Link>
```

**Examples:**

| Context | Link Text | Notes |
|---------|-----------|-------|
| Portfolio page header | `View Profile →` | Links to user's profile |
| Lightbox controls | `View Text →` | Opens text overlay |
| Lightbox controls | `View Submission →` | Navigates to full submission page |
| Featured submission | `View full submission →` | Links to submission detail |

**Key characteristics:**
- Use arrow (→) suffix to indicate navigation
- Use `text-muted-foreground` on light backgrounds
- Use `text-white/80` on dark backgrounds  
- Include hover state transition (`hover:text-foreground` or `hover:text-white`)
- Keep text concise and action-oriented

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
10. **Use mini-action links** for related page navigation instead of buttons
