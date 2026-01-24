import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  /** Max width class (default: max-w-6xl) */
  maxWidth?:
    | "max-w-2xl"
    | "max-w-3xl"
    | "max-w-4xl"
    | "max-w-5xl"
    | "max-w-6xl"
    | "max-w-7xl"
    | "max-w-none"
    | "max-w-full";
  /** Additional class names */
  className?: string;
  /** Whether to include horizontal padding (default: true) */
  withPadding?: boolean;
}

/**
 * Page layout wrapper for consistent page structure.
 * Use this for pages that need custom max-widths or additional styling.
 */
export function PageLayout({
  children,
  maxWidth = "max-w-6xl",
  className,
  withPadding = true,
}: PageLayoutProps) {
  return (
    <main
      className={cn(
        "mx-auto flex-1 w-full max-w-full",
        withPadding && "py-12",
        maxWidth,
        withPadding && "px-6",
        className,
      )}
    >
      {children}
    </main>
  );
}
