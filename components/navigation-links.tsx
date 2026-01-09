"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PromptsDropdown } from "./prompts-dropdown";
import { ExhibitionsDropdown } from "./exhibitions-dropdown";

interface NavigationLinksProps {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
}

export function NavigationLinks({ isAuthenticated }: NavigationLinksProps) {
  const pathname = usePathname();
  const isAboutPage = pathname === "/about" || pathname.startsWith("/about/");
  const aboutClassName = `rounded-md px-2 py-1 text-sm transition-colors ${
    isAboutPage
      ? "bg-accent text-accent-foreground font-medium"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  }`;

  return (
    <nav className="flex items-center gap-4">
      <ExhibitionsDropdown />
      <PromptsDropdown isAuthenticated={isAuthenticated} />
      <Link href="/about" className={aboutClassName}>
        About
      </Link>
    </nav>
  );
}
