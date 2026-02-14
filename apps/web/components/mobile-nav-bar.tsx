"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MobileNavBarItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

interface MobileNavBarProps {
  items: MobileNavBarItem[];
  /** Layout when expanded: "grid" = 4-column grid (many items), "flex" = flex with space-around (few items). Default "flex". */
  layout?: "grid" | "flex";
  /** When true, always show expanded nav (icon + label per item); no collapsed state or overlay. */
  alwaysExpanded?: boolean;
}

export function MobileNavBar({
  items,
  layout = "flex",
  alwaysExpanded = false,
}: MobileNavBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeItem = items.find((item) => item.isActive) ?? items[0];
  const showExpanded = alwaysExpanded || isExpanded;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
      {!alwaysExpanded && isExpanded && (
        <div
          className="fixed inset-0 bg-black/20"
          onClick={() => setIsExpanded(false)}
          aria-hidden
        />
      )}
      <div className="relative border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {showExpanded ? (
          <nav className="p-2" aria-label="Navigation">
            <ul
              className={cn(
                "flex items-center gap-1",
                layout === "grid" && "grid grid-cols-4 gap-1",
                layout === "flex" && "justify-around",
              )}
            >
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => !alwaysExpanded && setIsExpanded(false)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium transition-colors",
                      layout === "grid" ? "px-1" : "px-4",
                      item.isActive
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        item.isActive && "text-primary",
                      )}
                    />
                    <span
                      className={cn(
                        "truncate text-center w-full",
                        layout === "grid" && "w-full",
                      )}
                    >
                      {item.label}
                    </span>
                    {item.isActive && (
                      <span className="h-1 w-1 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-foreground"
            aria-expanded={isExpanded}
            aria-label="Open navigation menu"
          >
            <activeItem.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{activeItem.label}</span>
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
