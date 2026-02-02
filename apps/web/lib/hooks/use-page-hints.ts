import { useMemo, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { TutorialManager } from "@/lib/tutorial-manager";
import { getGlobalHintsKeys, getPageHintsConfig } from "@/lib/hints-config";
import type { HintConfig } from "@/lib/hints-helper";

interface UsePageHintsOptions {
  tutorialData: any;
  page: string;
  context?: any;
}

/**
 * Map page names to translation namespaces.
 * This determines which translation namespace to use for resolving hint translations.
 */
function getTranslationNamespace(page: string): string {
  if (page === "global") return "global";
  if (page.startsWith("portfolio")) return "profile";
  if (page.startsWith("profile")) return "profile";
  if (page.startsWith("submission")) return "submission";
  // Default to "profile" for unknown pages
  return "profile";
}

/**
 * Hook to manage page-specific hints using TutorialManager.
 * Returns the next hint to show based on order and seen status.
 *
 * This is a client-side hook that:
 * - Looks up hints from centralized config based on page name
 * - Resolves translations using useTranslations
 * - Performs client-side coordination with global hints to check if they're
 *   actually rendering (e.g., if their target elements exist)
 *
 * The hook handles all logic for determining if hints should be shown:
 * - Checks if user is logged in (via tutorialData presence)
 * - Checks if tutorials are enabled (via TutorialManager)
 * - Checks if there are available hints
 * - Checks if global hints are actually rendering (client-side DOM check)
 * - Returns the next hint based on order and seen status
 *
 * @param options - Configuration for hints
 * @param options.tutorialData - User's tutorial data from database
 * @param options.page - Page identifier (e.g., "portfolio-view", "profile-view", "submission-view")
 * @param options.context - Optional context object for conditional hints (e.g., { critiquesEnabled: true })
 * @returns The next hint to show, or null if hints shouldn't be shown
 */
export function usePageHints({
  tutorialData,
  page,
  context,
}: UsePageHintsOptions): HintConfig | null {
  const namespace = getTranslationNamespace(page);
  const t = useTranslations(namespace);
  const [globalHintRendering, setGlobalHintRendering] = useState(false);

  // Get hints from centralized config and resolve translations
  const availableHints = useMemo(() => {
    const hintConfigs = getPageHintsConfig(page, context);
    return hintConfigs.map((hint) => ({
      key: hint.key,
      order: hint.order,
      title: t(hint.translationKeys.title),
      description: t(hint.translationKeys.description),
      targetSelector: hint.targetSelector,
      side: hint.side,
      showArrow: hint.showArrow,
      fixedPosition: hint.fixedPosition,
    }));
  }, [page, context, t]);

  // Check client-side if a global hint is actually rendering
  useEffect(() => {
    if (!tutorialData) {
      setGlobalHintRendering(false);
      return;
    }

    const tutorialManager = new TutorialManager(tutorialData);
    const globalHintsKeys = getGlobalHintsKeys();
    const nextGlobalHintKey =
      tutorialManager.getNextPendingGlobalHint(globalHintsKeys);

    if (!nextGlobalHintKey) {
      setGlobalHintRendering(false);
      return;
    }

    const globalHints = getPageHintsConfig("global");
    const nextGlobalHint = globalHints.find((h) => h.key === nextGlobalHintKey);

    if (!nextGlobalHint) {
      setGlobalHintRendering(false);
      return;
    }

    // Fixed-position hints always render
    if (nextGlobalHint.fixedPosition) {
      setGlobalHintRendering(true);
      return;
    }

    // For target-based hints, check if the target element exists and is visible
    if (nextGlobalHint.targetSelector) {
      const checkTarget = () => {
        const element = document.querySelector(nextGlobalHint.targetSelector!);
        if (!element) {
          setGlobalHintRendering(false);
          return;
        }

        // Check if element is visible
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0";

        setGlobalHintRendering(isVisible);
      };

      // Check immediately
      checkTarget();

      // Also check on DOM changes (in case element appears later)
      const observer = new MutationObserver(checkTarget);
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });

      // Check on resize/scroll in case visibility changes
      window.addEventListener("resize", checkTarget);
      window.addEventListener("scroll", checkTarget);

      return () => {
        observer.disconnect();
        window.removeEventListener("resize", checkTarget);
        window.removeEventListener("scroll", checkTarget);
      };
    }

    setGlobalHintRendering(false);
  }, [tutorialData]);

  return useMemo(() => {
    // If no tutorial data, user is not logged in - don't show hints
    if (!tutorialData) {
      return null;
    }

    // If no hints available for this page, nothing to show
    if (availableHints.length === 0) {
      return null;
    }

    // If a global hint is actually rendering, suppress page hints
    if (globalHintRendering) {
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
  }, [tutorialData, page, availableHints, globalHintRendering]);
}

// Re-export HintConfig for convenience
export type { HintConfig };
