"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { EXHIBITION_CONFIGS } from "@/lib/exhibition-constants";
import type { ExhibitionType } from "@/lib/exhibition-constants";

interface ViewOption {
  type: ExhibitionType;
  label: string;
  path: string;
}

interface ExhibitViewSelectorProps {
  currentView: ExhibitionType;
  exhibitId?: string;
  allowedViewTypes?: string[];
}

export function ExhibitViewSelector({
  currentView,
  exhibitId,
  allowedViewTypes,
}: ExhibitViewSelectorProps) {
  const searchParams = useSearchParams();

  // Build available view types
  const allViewTypes: ViewOption[] = [
    {
      type: "gallery",
      label: EXHIBITION_CONFIGS.gallery.name,
      path: EXHIBITION_CONFIGS.gallery.path,
    },
    {
      type: "constellation",
      label: EXHIBITION_CONFIGS.constellation.name,
      path: EXHIBITION_CONFIGS.constellation.path,
    },
    {
      type: "global",
      label: EXHIBITION_CONFIGS.global.name,
      path: EXHIBITION_CONFIGS.global.path,
    },
  ];

  // For temporary exhibits, filter by allowedViewTypes
  // For permanent exhibits, show all views
  const availableViews = exhibitId
    ? allViewTypes.filter((view) => allowedViewTypes?.includes(view.type))
    : allViewTypes;

  // Filter out the current view
  const otherViews = availableViews.filter((view) => view.type !== currentView);

  // If no other views available, don't show the selector
  if (otherViews.length === 0) {
    return null;
  }

  // Build URL with exhibitId if present, preserving other search params
  const buildUrl = (path: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (exhibitId) {
      params.set("exhibitId", exhibitId);
    } else {
      params.delete("exhibitId");
    }
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          View Options
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {otherViews.map((view) => {
          const Icon = EXHIBITION_CONFIGS[view.type].icon;
          return (
            <DropdownMenuItem key={view.type} asChild>
              <Link
                href={buildUrl(view.path)}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                {view.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
