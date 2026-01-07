"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
            href="/exhibition/gallery"
            className={cn(
              (pathname === "/exhibition/gallery" ||
                pathname.startsWith("/exhibition/gallery/")) &&
                "bg-accent text-accent-foreground"
            )}
          >
            Gallery
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/exhibition/constellation"
            className={cn(
              (pathname === "/exhibition/constellation" ||
                pathname.startsWith("/exhibition/constellation/")) &&
                "bg-accent text-accent-foreground"
            )}
          >
            Constellation
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
