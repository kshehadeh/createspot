/**
 * Shared configuration for global hints.
 * This file contains the structural configuration (keys, orders, selectors, etc.)
 * that can be used by both the GlobalHints component and the hints helper.
 *
 * Note: Translations (title/description) are handled in the component since
 * it's a client component with access to useTranslations.
 */

export interface GlobalHintConfig {
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
}

/**
 * Global hints configuration with keys and orders.
 * This is used to check for pending global hints and coordinate with page hints.
 */
export const GLOBAL_HINTS_CONFIG: GlobalHintConfig[] = [
  {
    key: "exhibits",
    order: 1,
    targetSelector: "a[href='/exhibition']",
    side: "bottom",
    showArrow: true,
  },
  {
    key: "creators",
    order: 2,
    targetSelector: "a[href='/creators']",
    side: "bottom",
    showArrow: true,
  },
  {
    key: "critiqueDidYouKnow",
    order: 3,
    fixedPosition: { bottom: 24, right: 24 },
    showArrow: false,
  },
  {
    key: "socialPackDidYouKnow",
    order: 4,
    fixedPosition: { bottom: 24, right: 24 },
    showArrow: false,
  },
];

/**
 * Get the global hints configuration with just keys and orders.
 * Used by TutorialManager to check for pending global hints.
 */
export function getGlobalHintsKeys(): Array<{ key: string; order: number }> {
  return GLOBAL_HINTS_CONFIG.map((hint) => ({
    key: hint.key,
    order: hint.order,
  }));
}
