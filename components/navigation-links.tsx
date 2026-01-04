"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminDropdown } from "./admin-dropdown";

interface NavigationLinksProps {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
}

export function NavigationLinks({
  isAuthenticated,
  isAdmin,
}: NavigationLinksProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const linkClassName = (path: string) => {
    const baseClasses = "text-sm transition-colors dark:hover:text-white";
    const activeClasses = isActive(path)
      ? "text-zinc-900 font-medium dark:text-white"
      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400";
    return `${baseClasses} ${activeClasses}`;
  };

  return (
    <nav className="flex items-center gap-4">
      <Link href="/prompt" className={linkClassName("/prompt")}>
        Prompts
      </Link>
      {isAuthenticated && (
        <>
          <Link href="/prompt/play" className={linkClassName("/prompt/play")}>
            Play
          </Link>
          <Link href="/prompt/history" className={linkClassName("/prompt/history")}>
            History
          </Link>
        </>
      )}
      {isAdmin && <AdminDropdown />}
    </nav>
  );
}
