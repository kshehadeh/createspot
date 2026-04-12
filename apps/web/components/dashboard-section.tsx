import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Editorial dashboard: caps label, flat panel, minimal shadow */
  editorial?: boolean;
}

export function DashboardSection({
  title,
  action,
  children,
  className,
  editorial,
}: DashboardSectionProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-2xl p-4 sm:p-5",
        editorial
          ? "dashboard-editorial-panel border border-white/[0.06] bg-[#141414]"
          : "bg-surface-container shadow-[0_14px_35px_rgb(0_0_0_/_0.35)]",
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between",
          editorial ? "sm:items-start" : "sm:items-center",
        )}
      >
        <h2
          className={cn(
            "text-foreground",
            editorial
              ? "text-[11px] font-semibold tracking-[0.16em] uppercase"
              : "text-base font-semibold tracking-tight sm:text-lg",
          )}
        >
          {title}
        </h2>
        {action && (
          <div
            className={cn(
              "shrink-0",
              editorial
                ? "text-on-surface-variant"
                : "text-sm text-on-surface-variant",
            )}
          >
            {action}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
