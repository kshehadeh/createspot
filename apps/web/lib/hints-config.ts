/**
 * Centralized configuration for all hints (global and page-specific).
 * This file contains all hint definitions grouped by page name.
 *
 * Translation keys are stored here, and translations are resolved at runtime
 * in server components (via getTranslations) or client components (via useTranslations).
 */

export interface HintConfig {
  key: string;
  order: number;
  targetSelector?: string;
  side?: "top" | "right" | "bottom" | "left";
  fixedPosition?: {
    bottom?: number;
    right?: number;
    top?: number;
    left?: number;
  };
  showArrow?: boolean;
  // Translation keys (not the actual translated strings)
  // These will be resolved using getTranslations/useTranslations
  translationKeys: {
    title: string;
    description: string;
  };
  // Optional: conditional logic function to determine if hint should be included
  shouldInclude?: (context?: any) => boolean;
}

/**
 * All hints configuration grouped by page name.
 * Page names should be specific and descriptive:
 * - "global" - Hints that appear on all pages
 * - "portfolio-view" - Viewing a portfolio
 * - "portfolio-edit" - Editing/managing portfolio
 * - "profile-view" - Viewing a profile
 * - "profile-edit" - Editing profile
 * - "submission-view" - Viewing a submission
 */
const HINTS_CONFIG: Record<string, HintConfig[]> = {
  global: [
    {
      key: "exhibits",
      order: 1,
      targetSelector: "a[href='/exhibition']",
      side: "bottom",
      showArrow: true,
      translationKeys: {
        title: "exhibitHintTitle",
        description: "exhibitHintDescription",
      },
    },
    {
      key: "creators",
      order: 2,
      targetSelector: "a[href='/creators']",
      side: "bottom",
      showArrow: true,
      translationKeys: {
        title: "creatorHintTitle",
        description: "creatorHintDescription",
      },
    },
    {
      key: "critiqueDidYouKnow",
      order: 3,
      fixedPosition: { bottom: 24, right: 24 },
      showArrow: false,
      translationKeys: {
        title: "critiqueDidYouKnowTitle",
        description: "critiqueDidYouKnowDescription",
      },
    },
    {
      key: "socialPackDidYouKnow",
      order: 4,
      fixedPosition: { bottom: 24, right: 24 },
      showArrow: false,
      translationKeys: {
        title: "socialPackDidYouKnowTitle",
        description: "socialPackDidYouKnowDescription",
      },
    },
    {
      key: "progressionsDidYouKnow",
      order: 5,
      fixedPosition: { bottom: 24, right: 24 },
      showArrow: false,
      translationKeys: {
        title: "progressionsDidYouKnowTitle",
        description: "progressionsDidYouKnowDescription",
      },
    },
    {
      key: "communityDidYouKnow",
      order: 6,
      fixedPosition: { bottom: 24, right: 24 },
      showArrow: false,
      translationKeys: {
        title: "communityDidYouKnowTitle",
        description: "communityDidYouKnowDescription",
      },
    },
  ],
  "portfolio-view": [
    {
      key: "collections",
      order: 1,
      targetSelector: "a[data-hint-target='collections-button']",
      side: "bottom",
      showArrow: true,
      translationKeys: {
        title: "collectionsHintTitle",
        description: "collectionsHintDescription",
      },
    },
  ],
  "portfolio-edit": [
    // Hints for portfolio edit page (if any)
  ],
  "profile-view": [
    {
      key: "profiles",
      order: 1,
      fixedPosition: { bottom: 24, right: 24 },
      showArrow: false,
      translationKeys: {
        title: "didYouKnowProfilesTitle",
        description: "didYouKnowProfilesDescription",
      },
    },
    {
      key: "managePortfolio",
      order: 2,
      targetSelector: "a[href*='/portfolio/edit']",
      side: "bottom",
      showArrow: true,
      translationKeys: {
        title: "didYouKnowManagePortfolioTitle",
        description: "didYouKnowManagePortfolioDescription",
      },
      shouldInclude: (context) => context?.isOwnProfile === true,
    },
  ],
  "profile-edit": [
    // Hints for profile edit page (if any)
  ],
  "submission-view": [
    {
      key: "critique",
      order: 1,
      targetSelector: "button[data-hint-target='critique-button']",
      side: "bottom",
      showArrow: true,
      translationKeys: {
        title: "critiqueHintTitle",
        description: "critiqueHintDescription",
      },
      shouldInclude: (context) => context?.critiquesEnabled === true,
    },
  ],
  "submission-edit": [
    {
      key: "addProgression",
      order: 1,
      targetSelector: "button[data-hint-target='add-progression-button']",
      side: "bottom",
      showArrow: true,
      translationKeys: {
        title: "addProgressionHintTitle",
        description: "addProgressionHintDescription",
      },
    },
  ],
  "critiques-view": [
    {
      key: "addCritiqueSelection",
      order: 1,
      targetSelector: "button[data-hint-target='add-critique-button']",
      side: "bottom",
      showArrow: true,
      translationKeys: {
        title: "addCritiqueHintTitle",
        description: "addCritiqueHintDescription",
      },
      shouldInclude: (context) => context?.canCritique === true,
    },
  ],
};

/**
 * Get hints configuration for a specific page.
 * Filters hints based on shouldInclude if context is provided.
 *
 * @param page - Page identifier (e.g., "global", "portfolio-view", "profile-view")
 * @param context - Optional context object for conditional hints
 * @returns Array of hint configurations for the page
 */
export function getPageHintsConfig(page: string, context?: any): HintConfig[] {
  const hints = HINTS_CONFIG[page] || [];

  // Filter hints based on shouldInclude if provided
  return hints.filter((hint) => {
    if (hint.shouldInclude) {
      return hint.shouldInclude(context);
    }
    return true;
  });
}

/**
 * Get the global hints configuration with just keys and orders.
 * Used by TutorialManager to check for pending global hints.
 * This maintains backward compatibility with existing code.
 */
export function getGlobalHintsKeys(): Array<{ key: string; order: number }> {
  const globalHints = HINTS_CONFIG.global || [];
  return globalHints.map((hint) => ({
    key: hint.key,
    order: hint.order,
  }));
}
