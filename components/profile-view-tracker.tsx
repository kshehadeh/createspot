"use client";

import { useEffect, useRef } from "react";

interface ProfileViewTrackerProps {
  profileUserId: string;
}

export function ProfileViewTracker({ profileUserId }: ProfileViewTrackerProps) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    async function trackView() {
      try {
        await fetch("/api/profile/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileUserId }),
        });
      } catch (error) {
        // Silently fail - view tracking is not critical
        console.error("Failed to track profile view:", error);
      }
    }

    trackView();
  }, [profileUserId]);

  // This component doesn't render anything
  return null;
}
