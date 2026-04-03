"use client";

import { useState } from "react";
import Link from "@/components/link";
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
  /** Layout when expanded: "grid" = 4-column grid (many items), "flex" = flex with even spacing (few items). Default "flex". */
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

  /** Keeps first/last items off screen edges and gesture zones (iOS back-swipe, etc.). */
  const navInsetX =
    "pl-[max(2rem,env(safe-area-inset-left,0px))] pr-[max(2rem,env(safe-area-inset-right,0px))]";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
      {!alwaysExpanded && isExpanded && (
        <div
          className="fixed inset-0 bg-black/20"
          onClick={() => setIsExpanded(false)}
          aria-hidden
        />
      )}
      <div className="relative border-t border-border bg-background/95 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {showExpanded ? (
          <nav className={cn("py-2", navInsetX)} aria-label="Navigation">
            <div
              className={cn(
                layout === "flex" &&
                  "overflow-x-auto touch-pan-x [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain] scrollbar-hide",
              )}
            >
              <ul
                className={cn(
                  "flex items-center gap-1",
                  layout === "grid" && "grid grid-cols-4 gap-1",
                  layout === "flex" &&
                    "flex-nowrap justify-evenly w-full min-w-min",
                )}
              >
                {items.map((item) => (
                  <li
                    key={item.href}
                    className={cn(
                      layout === "flex" && "shrink-0 min-w-[4.5rem]",
                    )}
                  >
                    <Link
                      href={item.href}
                      prefetch={true}
                      onClick={() => !alwaysExpanded && setIsExpanded(false)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors min-w-0",
                        layout === "grid" ? "px-1" : "px-3",
                        item.isActive
                          ? "text-primary bg-primary/10"
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
                          "truncate text-center w-full max-w-[4.5rem]",
                          layout === "grid" && "w-full max-w-none",
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className={cn(
              "flex w-full items-center justify-center gap-2 py-3 text-sm font-medium text-foreground",
              navInsetX,
            )}
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
