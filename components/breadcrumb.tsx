import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export interface BreadcrumbSegment {
  label: string;
  href?: string;
  icon?: LucideIcon;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
}

export function Breadcrumb({ segments }: BreadcrumbProps) {
  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-row items-center border-b border-border px-6 py-2 sm:px-12">
      {segments.map((segment, index) => {
        const isLastSegment = index === segments.length - 1;
        const IconComponent = segment.icon;

        return (
          <span key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="mx-1 h-4 w-4 text-muted-foreground"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            {segment.href && !isLastSegment ? (
              <Link
                href={segment.href}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {IconComponent && <IconComponent className="h-5 w-5" />}
                {segment.label}
              </Link>
            ) : (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {IconComponent && <IconComponent className="h-5 w-5" />}
                {segment.label}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
