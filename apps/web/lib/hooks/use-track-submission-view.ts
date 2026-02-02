import { useEffect, useRef } from "react";

/**
 * Hook to track submission views for analytics.
 *
 * @param submissionId - The ID of the submission to track
 * @param isOwner - Whether the current user is the owner of the submission
 * @param shouldTrack - Optional condition to control when to track (e.g., when lightbox is open)
 *                      If not provided, tracks once on mount
 *
 * @example
 * // Track on mount (e.g., submission detail page)
 * useTrackSubmissionView(submissionId, isOwner);
 *
 * @example
 * // Track when condition is true (e.g., lightbox opens)
 * useTrackSubmissionView(submissionId, isOwner, isOpen);
 */
export function useTrackSubmissionView(
  submissionId: string,
  isOwner: boolean,
  shouldTrack: boolean = true,
) {
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    // Only track if:
    // 1. We should track (condition is met)
    // 2. User is not the owner
    // 3. We haven't already tracked this view
    if (shouldTrack && !isOwner && !viewTrackedRef.current) {
      viewTrackedRef.current = true;

      // Call the view tracking API
      fetch(`/api/submissions/${submissionId}/view`, {
        method: "POST",
      }).catch(() => {
        // Silently handle errors - view tracking is non-critical
      });
    }

    // Reset tracking ref when condition becomes false (e.g., lightbox closes)
    // This allows tracking again if the condition becomes true again
    if (!shouldTrack) {
      viewTrackedRef.current = false;
    }
  }, [submissionId, isOwner, shouldTrack]);
}
