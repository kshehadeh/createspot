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
        "min-w-0 rounded-xl border border-border/60 bg-card/50 p-4 sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {action && (
          <div className="shrink-0 text-sm text-muted-foreground">{action}</div>
        )}
      </div>
      {children}
    </section>
  );
}
