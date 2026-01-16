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
  // For permanent exhibits, only show gallery and global (not constellation/path)
  const availableViews = exhibitId
    ? allViewTypes.filter((view) => allowedViewTypes?.includes(view.type))
    : allViewTypes.filter((view) => view.type !== "constellation");

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
            className="h-4 w-4 sm:mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="hidden sm:inline">View Options</span>
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
