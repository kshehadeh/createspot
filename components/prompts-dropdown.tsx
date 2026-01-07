"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptsDropdownProps {
  isAuthenticated?: boolean;
}

export function PromptsDropdown({ isAuthenticated }: PromptsDropdownProps) {
  const pathname = usePathname();
  const isPromptPage = pathname.startsWith("/prompt");

  const isActive = (path: string) => {
    if (path === "/prompt") {
      return pathname === "/prompt";
    }
    return pathname.startsWith(path);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors outline-none",
          isPromptPage
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <span>Inspire</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider">
          Prompts
        </DropdownMenuLabel>
        {isAuthenticated ? (
          <>
            <DropdownMenuItem asChild>
              <Link
                href="/prompt/play"
                className={cn(
                  isActive("/prompt/play") &&
                    "bg-accent text-accent-foreground"
                )}
              >
                Play
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/prompt/history"
                className={cn(
                  isActive("/prompt/history") &&
                    "bg-accent text-accent-foreground"
                )}
              >
                History
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem asChild>
            <Link
              href="/prompt"
              className={cn(
                isActive("/prompt") &&
                  "bg-accent text-accent-foreground"
              )}
            >
              Prompts
            </Link>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
