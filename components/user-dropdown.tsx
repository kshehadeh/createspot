"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserDropdownProps {
  id?: string;
  name?: string | null;
  image?: string | null;
  isAdmin?: boolean;
}

export function UserDropdown({ id, name, image, isAdmin }: UserDropdownProps) {
  const pathname = usePathname();
  const handleLogout = () => {
    signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 border-l border-zinc-200 pl-4 outline-none dark:border-zinc-700">
        {name && (
          <span className="hidden text-sm text-foreground lg:inline">
            {name}
          </span>
        )}
        <Avatar className="h-8 w-8">
          <AvatarImage src={image || undefined} alt={name || "User avatar"} />
          <AvatarFallback className="bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            {name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {id && (
          <DropdownMenuItem asChild>
            <Link href={`/profile/${id}`}>View Profile</Link>
          </DropdownMenuItem>
        )}
        {id && (
          <DropdownMenuItem asChild>
            <Link href={`/portfolio/${id}`}>View Portfolio</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/favorites">Favorites</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/admin"
                className={cn(
                  pathname === "/admin" && "bg-accent text-accent-foreground",
                )}
              >
                Manage Prompts
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/admin/users"
                className={cn(
                  pathname === "/admin/users" &&
                    "bg-accent text-accent-foreground",
                )}
              >
                Manage Users
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/admin/exhibits"
                className={cn(
                  pathname.startsWith("/admin/exhibits") &&
                    "bg-accent text-accent-foreground",
                )}
              >
                Manage Exhibits
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
