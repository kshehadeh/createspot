"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";

interface UserDropdownProps {
  id?: string;
  name?: string | null;
  image?: string | null;
}

export function UserDropdown({ id, name, image }: UserDropdownProps) {
  const handleLogout = () => {
    signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 border-l border-zinc-200 pl-4 outline-none dark:border-zinc-700">
        {name && (
          <span className="hidden text-sm text-zinc-600 dark:text-zinc-400 sm:inline">
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
        <DropdownMenuItem asChild>
          <Link href="/profile/edit">Edit Profile</Link>
        </DropdownMenuItem>
        {id && (
          <DropdownMenuItem asChild>
            <Link href="/profile/edit#portfolio">Edit Portfolio</Link>
          </DropdownMenuItem>
        )}
        {id && (
          <DropdownMenuItem asChild>
            <Link href={`/profile/${id}`}>View Public Profile</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/favorites">Favorites</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
