import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CreatorHubHeaderLayoutProps {
  avatar: ReactNode;
  children: ReactNode;
  className?: string;
}

export function CreatorHubHeaderLayout({
  avatar,
  children,
  className,
}: CreatorHubHeaderLayoutProps) {
  return (
    <div className={cn("flex items-start gap-4", className)}>
      {avatar}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
