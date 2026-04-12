"use client";

import type { ReactNode } from "react";
import { AppChromeProvider } from "@/components/app-chrome-context";
import { AppSidebar } from "@/components/app-sidebar";

interface AppSidebarUser {
  id?: string;
  slug?: string | null;
  name?: string | null;
  image?: string | null;
  profileImageUrl?: string | null;
  isAdmin?: boolean;
}

interface AppLayoutClientProps {
  user?: AppSidebarUser | null;
  children: ReactNode;
}

export function AppLayoutClient({ user, children }: AppLayoutClientProps) {
  return (
    <AppChromeProvider>
      <div className="flex min-h-0 flex-1">
        <AppSidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </AppChromeProvider>
  );
}
