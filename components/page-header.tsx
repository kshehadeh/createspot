import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string | ReactNode;
  subtitle?: string;
  rightContent?: ReactNode;
}

export function PageHeader({ title, subtitle, rightContent }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
      </div>
    </div>
  );
}
