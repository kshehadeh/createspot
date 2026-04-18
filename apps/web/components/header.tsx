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
    <div className="relative z-30 h-0 shrink-0 overflow-visible md:hidden">
      <header className="pointer-events-none fixed top-0 right-0 flex items-start justify-end gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-2 sm:px-4">
        <div className="pointer-events-auto">
          <MobileNavigation user={user} showCreateButton={false} />
        </div>
      </header>
    </div>
  );
}
