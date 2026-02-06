"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import { getUserImageUrl } from "@/lib/user-image";
import { getRoute } from "@/lib/routes";
import { ThemeToggle } from "./theme-toggle";

interface UserDropdownProps {
  name?: string | null;
  image?: string | null;
  profileImageUrl?: string | null;
}

export function UserDropdown({
  name,
  image,
  profileImageUrl,
}: UserDropdownProps) {
  const [mounted, setMounted] = useState(false);
  const logoutRoute = getRoute("logout");

  const handleLogout = () => {
    signOut();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayImage = getUserImageUrl(profileImageUrl, image);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 border-l border-border pl-4 outline-none">
        {name && (
          <span className="hidden text-sm text-foreground lg:inline">
            {name}
          </span>
        )}
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={displayImage || undefined}
            alt={name || "User avatar"}
          />
          <AvatarFallback className="bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            {name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 border-l border-border pl-4 outline-none">
        {name && (
          <span className="hidden text-sm text-foreground lg:inline">
            {name}
          </span>
        )}
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={displayImage || undefined}
            alt={name || "User avatar"}
          />
          <AvatarFallback className="bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            {name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="flex items-center justify-center px-2 py-2">
          <ThemeToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          {logoutRoute.icon && <logoutRoute.icon className="h-4 w-4 mr-2" />}
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
