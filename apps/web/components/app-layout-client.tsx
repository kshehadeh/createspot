"use client";

import type { ReactNode } from "react";
import {
  AppChromeProvider,
  useAppChrome,
} from "@/components/app-chrome-context";
import { AppSidebar } from "@/components/app-sidebar";
import { GlobalCommandMenu } from "@/components/global-command-menu";
import { SubmissionEditModal } from "@/components/submission-edit-modal";

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

function AppChromeModals({ user }: { user?: AppSidebarUser | null }) {
  const { createSubmissionOpen, setCreateSubmissionOpen } = useAppChrome();
  if (!user) return null;
  return (
    <SubmissionEditModal
      isOpen={createSubmissionOpen}
      onClose={() => setCreateSubmissionOpen(false)}
      mode="create"
    />
  );
}

export function AppLayoutClient({ user, children }: AppLayoutClientProps) {
  return (
    <AppChromeProvider>
      <GlobalCommandMenu user={user} />
      <AppChromeModals user={user} />
      <div className="flex min-h-0 flex-1">
        <AppSidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </AppChromeProvider>
  );
}
