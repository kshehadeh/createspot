"use client";

import { usePathname } from "next/navigation";
import { CreatorSidebar } from "@/components/creator-sidebar";
import { CreatorMobileNav } from "@/components/creator-mobile-nav";

interface CreatorOwnerShellProps {
  creatorUrl: string;
  children: React.ReactNode;
}

/** Submission routes where the owner sidebar should not appear on desktop. */
function isFullWidthSubmissionPath(pathname: string | null): boolean {
  if (!pathname) return false;
  // Main submission view: .../s/:submissionId only
  if (/\/s\/[^/]+\/?$/.test(pathname)) return true;
  return (
    /\/s\/[^/]+\/critiques\/?$/.test(pathname) ||
    /\/s\/[^/]+\/edit\/image\/?$/.test(pathname)
  );
}

export function CreatorOwnerShell({
  creatorUrl,
  children,
}: CreatorOwnerShellProps) {
  const pathname = usePathname();
  const hideSidebar = isFullWidthSubmissionPath(pathname);

  return (
    <div className="flex flex-1 gap-5">
      {!hideSidebar && <CreatorSidebar creatorUrl={creatorUrl} />}
      <div className="flex-1 min-w-0 pb-16 md:pb-0 md:pr-6 lg:pr-12">
        {children}
      </div>
      <CreatorMobileNav creatorUrl={creatorUrl} />
    </div>
  );
}
