"use client";

import { usePathname } from "next/navigation";
import { CreatorSidebar } from "@/components/creator-sidebar";
import { CreatorMobileNav } from "@/components/creator-mobile-nav";

interface CreatorOwnerShellProps {
  creatorUrl: string;
  children: React.ReactNode;
}

/** Submission critiques page: hide studio sidebar; mobile nav stays for quick exit. */
function isSubmissionCritiquesPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return /\/s\/[^/]+\/critiques\/?$/.test(pathname);
}

export function CreatorOwnerShell({
  creatorUrl,
  children,
}: CreatorOwnerShellProps) {
  const pathname = usePathname();
  const hideSidebar = isSubmissionCritiquesPath(pathname);

  return (
    <div className="flex flex-1">
      {!hideSidebar && <CreatorSidebar creatorUrl={creatorUrl} />}
      <div className="flex-1 min-w-0 pb-16 md:pb-0">{children}</div>
      <CreatorMobileNav creatorUrl={creatorUrl} />
    </div>
  );
}
