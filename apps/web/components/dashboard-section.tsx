import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardSection({
  title,
  action,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl bg-surface-container p-4 sm:p-5 shadow-[0_14px_35px_rgb(0_0_0_/_0.35)]",
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {title}
        </h2>
        {action && (
          <div className="shrink-0 text-sm text-on-surface-variant">
            {action}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
