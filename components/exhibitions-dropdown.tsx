"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { EXHIBITION_CONFIGS } from "@/lib/exhibition-constants";

export function ExhibitionsDropdown() {
  const pathname = usePathname();
  const isExhibitionPage =
    pathname.startsWith("/exhibition") || pathname === "/exhibition";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors outline-none",
          isExhibitionPage
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <span>Exhibits</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem asChild>
          <Link
            href="/exhibition"
            className={cn(
              "flex items-center gap-2",
              pathname === "/exhibition" && "bg-accent text-accent-foreground"
            )}
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={EXHIBITION_CONFIGS.gallery.path}
            className={cn(
              "flex items-center gap-2",
              (pathname === EXHIBITION_CONFIGS.gallery.path ||
                pathname.startsWith(`${EXHIBITION_CONFIGS.gallery.path}/`)) &&
                "bg-accent text-accent-foreground"
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
                pathname.startsWith(`${EXHIBITION_CONFIGS.constellation.path}/`)) &&
                "bg-accent text-accent-foreground"
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
                "bg-accent text-accent-foreground"
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
