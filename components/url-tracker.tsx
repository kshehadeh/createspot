"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRecentUrls } from "@/lib/hooks/use-recent-urls";

/**
 * Component that tracks visited URLs and stores them in localStorage
 * for use in the bug report form dropdown.
 */
export function UrlTracker() {
  const pathname = usePathname();
  const { addRecentUrl } = useRecentUrls();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Build full URL from pathname
    const fullUrl = `${window.location.origin}${pathname}`;
    addRecentUrl(fullUrl);
  }, [pathname, addRecentUrl]);

  // This component doesn't render anything
  return null;
}
