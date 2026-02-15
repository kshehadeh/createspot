import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface BreadcrumbSegment {
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
    <div className="flex min-w-0 flex-row flex-nowrap items-center overflow-hidden border-b border-border px-6 py-2 sm:px-12">
      {segments.map((segment, index) => {
        const IconComponent = segment.icon;

        return (
          <span
            key={index}
            className="flex min-w-0 shrink items-center overflow-hidden"
          >
            {index > 0 && (
              <svg
                className="mx-1 h-4 w-4 shrink-0 text-muted-foreground"
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
            {segment.href ? (
              <Link
                href={segment.href}
                className="flex min-w-0 shrink items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {IconComponent && (
                  <IconComponent className="h-5 w-5 shrink-0" />
                )}
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {segment.label}
                </span>
              </Link>
            ) : (
              <span className="flex min-w-0 shrink items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-foreground">
                {IconComponent && (
                  <IconComponent className="h-5 w-5 shrink-0" />
                )}
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  {segment.label}
                </span>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
