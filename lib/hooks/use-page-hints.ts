import { useMemo } from "react";
import { getNextPageHint, type HintConfig } from "@/lib/hints-helper";

interface UsePageHintsOptions {
  tutorialData: any;
  page: string;
  availableHints: HintConfig[];
}

/**
 * Hook to manage page-specific hints using TutorialManager.
 * Returns the next hint to show based on order and seen status.
 * 
 * This is a client-side hook that wraps the server-compatible getNextPageHint helper.
 * 
 * The hook handles all logic for determining if hints should be shown:
 * - Checks if user is logged in (via tutorialData presence)
 * - Checks if tutorials are enabled (via TutorialManager)
 * - Checks if there are available hints
 * - Returns the next hint based on order and seen status
 *
 * @param options - Configuration for hints
 * @returns The next hint to show, or null if hints shouldn't be shown
 */
export function usePageHints({
  tutorialData,
  page,
  availableHints,
}: UsePageHintsOptions): HintConfig | null {
  return useMemo(
    () => getNextPageHint(tutorialData, page, availableHints),
    [tutorialData, page, availableHints],
  );
}

// Re-export HintConfig for convenience
export type { HintConfig };
