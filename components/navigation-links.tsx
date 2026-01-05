"use client";

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
  return (
    <nav className="flex items-center gap-4">
      <ExhibitionsDropdown />
      <PromptsDropdown isAuthenticated={isAuthenticated} />
      {isAdmin && <AdminDropdown />}
    </nav>
  );
}
