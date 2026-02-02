import { TutorialManager } from "@/lib/tutorial-manager";
import {
  getGlobalHintsKeys,
  getPageHintsConfig,
  type HintConfig as HintConfigBase,
} from "@/lib/hints-config";

/**
 * Hint configuration with translations resolved.
 * This is the format returned by getNextPageHint after resolving translations.
 */
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
 * Helper function to resolve translations for hints.
 * Used by server components that have access to getTranslations.
 *
 * @param hints - Array of hint configs with translation keys
 * @param translate - Translation function (from getTranslations) - already knows the namespace
 * @returns Array of hints with translations resolved
 */
function resolveHintTranslations(
  hints: HintConfigBase[],
  translate: (key: string) => string,
): HintConfig[] {
  return hints.map((hint) => {
    // The translate function already knows the namespace (from getTranslations(namespace)),
    // so we just pass the translation key directly without adding the namespace prefix
    return {
      key: hint.key,
      order: hint.order,
      title: translate(hint.translationKeys.title),
      description: translate(hint.translationKeys.description),
      targetSelector: hint.targetSelector,
      side: hint.side,
      showArrow: hint.showArrow,
      fixedPosition: hint.fixedPosition,
    };
  });
}

/**
 * Helper function to get the next hint to show for a page.
 * Can be used in server components with access to getTranslations.
 *
 * This function handles all logic for determining if hints should be shown:
 * - Looks up hints from centralized config based on page name
 * - Resolves translations using the provided translation function
 * - Checks if user is logged in (via tutorialData presence)
 * - Checks if tutorials are enabled
 * - Checks if there are pending global hints (global hints take priority)
 * - Returns the next hint based on order and seen status
 *
 * @param tutorialData - User's tutorial data from database (null if not logged in)
 * @param page - Page identifier (e.g., "portfolio-view", "profile-view", "submission-view")
 * @param translate - Translation function from getTranslations
 * @param namespace - Translation namespace (e.g., "profile", "global", "submission")
 * @param context - Optional context object for conditional hints (e.g., { isOwnProfile: true })
 * @returns The next hint to show, or null if hints shouldn't be shown
 */
export function getNextPageHint(
  tutorialData: any,
  page: string,
  translate: (key: string) => string,
  namespace: string,
  context?: any,
): HintConfig | null {
  // If no tutorial data, user is not logged in - don't show hints
  if (!tutorialData) {
    return null;
  }

  // Get hints from centralized config
  const hintConfigs = getPageHintsConfig(page, context);

  // If no hints available for this page, nothing to show
  if (hintConfigs.length === 0) {
    return null;
  }

  // Resolve translations
  const availableHints = resolveHintTranslations(hintConfigs, translate);

  const tutorialManager = new TutorialManager(tutorialData);

  // Check if there are pending global hints - if so, don't show page hints
  // Global hints take priority over page hints, but only if they would actually render.
  // Since we can't check DOM server-side, we only suppress page hints if the next
  // global hint is a fixed-position hint (which always renders). Target-based hints
  // might not render if their target doesn't exist, so we allow page hints in that case.
  const globalHintsKeys = getGlobalHintsKeys();
  const nextGlobalHintKey =
    tutorialManager.getNextPendingGlobalHint(globalHintsKeys);

  if (nextGlobalHintKey) {
    // Check if the next global hint is a fixed-position hint (always renders)
    const globalHints = getPageHintsConfig("global");
    const nextGlobalHint = globalHints.find((h) => h.key === nextGlobalHintKey);
    if (nextGlobalHint?.fixedPosition) {
      // Fixed-position hints always render, so suppress page hints
      return null;
    }
    // For target-based hints, we can't know server-side if they'll render,
    // so we allow page hints to show (they'll be suppressed client-side if the
    // global hint actually renders)
  }

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
