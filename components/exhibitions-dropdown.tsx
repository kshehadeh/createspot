"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { EXHIBITION_CONFIGS } from "@/lib/exhibition-constants";

interface CurrentExhibit {
  id: string;
  title: string;
}

export function ExhibitionsDropdown() {
  const pathname = usePathname();
  const [currentExhibits, setCurrentExhibits] = useState<CurrentExhibit[]>([]);
  const isExhibitionPage =
    pathname.startsWith("/exhibition") || pathname === "/exhibition";

  useEffect(() => {
    async function loadCurrentExhibits() {
      try {
        const response = await fetch("/api/exhibits");
        if (response.ok) {
          const data = await response.json();
          setCurrentExhibits(data.exhibits || []);
        }
      } catch {
        // Ignore errors
      }
    }
    loadCurrentExhibits();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors outline-none",
          isExhibitionPage
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <span>Exhibits</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem asChild>
          <Link
            href="/exhibition"
            className={cn(
              "flex items-center gap-2",
              pathname === "/exhibition" && "bg-accent text-accent-foreground",
            )}
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </DropdownMenuItem>
        {currentExhibits.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Current Exhibits</DropdownMenuLabel>
            {currentExhibits.map((exhibit) => (
              <DropdownMenuItem key={exhibit.id} asChild>
                <Link
                  href={`/exhibition/${exhibit.id}`}
                  className={cn(
                    "flex items-center gap-2",
                    pathname === `/exhibition/${exhibit.id}` &&
                      "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="truncate">{exhibit.title}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel>Permanent Exhibits</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link
            href={EXHIBITION_CONFIGS.gallery.path}
            className={cn(
              "flex items-center gap-2",
              (pathname === EXHIBITION_CONFIGS.gallery.path ||
                pathname.startsWith(`${EXHIBITION_CONFIGS.gallery.path}/`)) &&
                "bg-accent text-accent-foreground",
            )}
          >
            <EXHIBITION_CONFIGS.gallery.icon className="h-4 w-4" />
            {EXHIBITION_CONFIGS.gallery.name}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={EXHIBITION_CONFIGS.constellation.path}
            className={cn(
              "flex items-center gap-2",
              (pathname === EXHIBITION_CONFIGS.constellation.path ||
                pathname.startsWith(
                  `${EXHIBITION_CONFIGS.constellation.path}/`,
                )) &&
                "bg-accent text-accent-foreground",
            )}
          >
            <EXHIBITION_CONFIGS.constellation.icon className="h-4 w-4" />
            {EXHIBITION_CONFIGS.constellation.name}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={EXHIBITION_CONFIGS.global.path}
            className={cn(
              "flex items-center gap-2",
              (pathname === EXHIBITION_CONFIGS.global.path ||
                pathname.startsWith(`${EXHIBITION_CONFIGS.global.path}/`)) &&
                "bg-accent text-accent-foreground",
            )}
          >
            <EXHIBITION_CONFIGS.global.icon className="h-4 w-4" />
            {EXHIBITION_CONFIGS.global.name}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
