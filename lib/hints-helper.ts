import { TutorialManager } from "@/lib/tutorial-manager";

export interface HintConfig {
  key: string;
  order: number;
  title: string;
  description: string;
  targetSelector?: string;
  side?: "top" | "right" | "bottom" | "left";
  showArrow?: boolean;
  fixedPosition?: {
    bottom?: number;
    right?: number;
    top?: number;
    left?: number;
  };
}

/**
 * Helper function to get the next hint to show for a page.
 * Can be used in both server and client components.
 *
 * This function handles all logic for determining if hints should be shown:
 * - Checks if user is logged in (via tutorialData presence)
 * - Checks if tutorials are enabled
 * - Checks if there are available hints
 * - Returns the next hint based on order and seen status
 *
 * @param tutorialData - User's tutorial data from database (null if not logged in)
 * @param page - Page identifier (e.g., "profile", "submission")
 * @param availableHints - Array of hint configurations
 * @returns The next hint to show, or null if hints shouldn't be shown
 */
export function getNextPageHint(
  tutorialData: any,
  page: string,
  availableHints: HintConfig[],
): HintConfig | null {
  // If no tutorial data, user is not logged in - don't show hints
  if (!tutorialData) {
    return null;
  }

  // If no hints available for this page, nothing to show
  if (availableHints.length === 0) {
    return null;
  }

  const tutorialManager = new TutorialManager(tutorialData);

  // TutorialManager.getNextHint() already checks if tutorials are enabled
  // and if hints have been seen, so we can use it directly
  const nextHintKey = tutorialManager.getNextHint(
    page,
    availableHints.map((h) => ({ key: h.key, order: h.order })),
  );

  if (!nextHintKey) {
    return null;
  }

  // Find and return the full hint configuration
  return availableHints.find((h) => h.key === nextHintKey) || null;
}
