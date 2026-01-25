"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import { cn, getCreatorUrl } from "@/lib/utils";
import { getRoute } from "@/lib/routes";
import { getUserImageUrl } from "@/lib/user-image";

interface UserDropdownProps {
  id?: string;
  slug?: string | null;
  name?: string | null;
  image?: string | null;
  profileImageUrl?: string | null;
  isAdmin?: boolean;
}

export function UserDropdown({
  id,
  slug,
  name,
  image,
  profileImageUrl,
  isAdmin,
}: UserDropdownProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("navigation");
  const profileRoute = getRoute("profile");
  const portfolioRoute = getRoute("portfolio");
  const favoritesRoute = getRoute("favorites");
  const adminRoute = getRoute("admin");
  const logoutRoute = getRoute("logout");
  const handleLogout = () => {
    signOut();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get the preferred image URL (profileImageUrl > image > null)
  const displayImage = getUserImageUrl(profileImageUrl, image);

  // Render a placeholder during SSR to avoid hydration mismatch
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
            alt={name || t("userAvatar")}
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
            alt={name || t("userAvatar")}
          />
          <AvatarFallback className="bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            {name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {id && (
          <DropdownMenuItem asChild>
            <Link
              href={getCreatorUrl({ id, slug })}
              className="flex items-center gap-2"
            >
              {profileRoute.icon && <profileRoute.icon className="h-4 w-4" />}
              {t("profile")}
            </Link>
          </DropdownMenuItem>
        )}
        {id && (
          <DropdownMenuItem asChild>
            <Link
              href={`${getCreatorUrl({ id, slug })}/portfolio`}
              className="flex items-center gap-2"
            >
              {portfolioRoute.icon && (
                <portfolioRoute.icon className="h-4 w-4" />
              )}
              {t("portfolio")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={favoritesRoute.path} className="flex items-center gap-2">
            {favoritesRoute.icon && <favoritesRoute.icon className="h-4 w-4" />}
            {t("favorites")}
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={adminRoute.path}
                className={cn(
                  "flex items-center gap-2",
                  pathname.startsWith(adminRoute.path) &&
                    "bg-accent text-accent-foreground",
                )}
              >
                {adminRoute.icon && <adminRoute.icon className="h-4 w-4" />}
                {t("adminDashboard")}
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          {logoutRoute.icon && <logoutRoute.icon className="h-4 w-4" />}
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
