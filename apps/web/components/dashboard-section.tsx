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
        "rounded-lg border border-border/60 bg-card/50 p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {action && (
          <div className="shrink-0 text-sm text-muted-foreground">{action}</div>
        )}
      </div>
      {children}
    </section>
  );
}
