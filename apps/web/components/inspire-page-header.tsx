import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { cn } from "@/lib/utils";

interface InspirePageHeaderProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  rightContent?: ReactNode;
  className?: string;
}

interface InspireTitleProps {
  children: ReactNode;
  className?: string;
}

export function InspirePageHeader({
  title,
  subtitle,
  rightContent,
  className,
}: InspirePageHeaderProps) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      rightContent={rightContent}
      className={className}
    />
  );
}

export function InspireTitle({ children, className }: InspireTitleProps) {
  return <PageTitle className={cn(className)}>{children}</PageTitle>;
}
