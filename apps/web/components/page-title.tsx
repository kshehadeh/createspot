import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageTitleProps {
  children: ReactNode;
  className?: string;
}

interface PageSubtitleProps {
  children: ReactNode;
  className?: string;
}

export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1
      className={cn(
        "text-2xl font-semibold tracking-tight text-foreground break-words sm:text-3xl",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function PageSubtitle({ children, className }: PageSubtitleProps) {
  return (
    <p
      className={cn(
        "mt-2 text-sm text-on-surface-variant sm:text-base",
        className,
      )}
    >
      {children}
    </p>
  );
}
