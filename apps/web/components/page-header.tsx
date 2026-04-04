import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  rightContent?: ReactNode;
  /** Merged with default bottom margin; use `mb-0` when the parent uses `space-y-*` for gaps. */
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  rightContent,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {rightContent && (
          <div className="hidden md:flex flex-shrink-0">{rightContent}</div>
        )}
      </div>
    </div>
  );
}
