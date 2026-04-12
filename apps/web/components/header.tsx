"use client";

import { MobileNavigation } from "./mobile-navigation";

interface HeaderUser {
  id?: string;
  slug?: string | null;
  name?: string | null;
  image?: string | null;
  profileImageUrl?: string | null;
  isAdmin?: boolean;
}

interface HeaderProps {
  user?: HeaderUser | null;
}

/** Mobile-only: menu control. Desktop uses the sidebar; no title bar. */
export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex shrink-0 justify-end px-3 py-2 sm:px-4 md:hidden">
      <MobileNavigation user={user} showCreateButton={false} />
    </header>
  );
}
