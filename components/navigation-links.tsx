"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminDropdown } from "./admin-dropdown";
import { PromptsDropdown } from "./prompts-dropdown";
import { ExhibitionsDropdown } from "./exhibitions-dropdown";

interface NavigationLinksProps {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
}

export function NavigationLinks({
  isAuthenticated,
  isAdmin,
}: NavigationLinksProps) {
  const pathname = usePathname();
  const isAboutPage = pathname === "/about" || pathname.startsWith("/about/");
  const aboutClassName = `text-sm transition-colors dark:hover:text-white ${
    isAboutPage
      ? "text-zinc-900 font-medium dark:text-white"
      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
  }`;

  return (
    <nav className="flex items-center gap-4">
      <ExhibitionsDropdown />
      <PromptsDropdown isAuthenticated={isAuthenticated} />
      <Link href="/about" className={aboutClassName}>
        About
      </Link>
      {isAdmin && <AdminDropdown />}
    </nav>
  );
}
