"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminDropdown } from "./admin-dropdown";
import { PromptsDropdown } from "./prompts-dropdown";

interface NavigationLinksProps {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
}

export function NavigationLinks({
  isAuthenticated,
  isAdmin,
}: NavigationLinksProps) {
  const pathname = usePathname();
  const exhibitionActive = pathname.startsWith("/exhibition");
  const navLinkClass = `text-sm transition-colors ${
    exhibitionActive
      ? "text-zinc-900 font-medium dark:text-white"
      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
  }`;

  return (
    <nav className="flex items-center gap-4">
      <Link href="/exhibition" className={navLinkClass}>
        Exhibition
      </Link>
      <PromptsDropdown isAuthenticated={isAuthenticated} />
      {isAdmin && <AdminDropdown />}
    </nav>
  );
}
