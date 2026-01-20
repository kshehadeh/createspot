"use client";

import { useTranslations } from "next-intl";
import { HintPopover } from "@/components/hint-popover";
import { TutorialManager } from "@/lib/tutorial-manager";
import { GLOBAL_HINTS_CONFIG } from "@/lib/global-hints-config";

interface GlobalHintsProps {
  tutorialData: any;
  userId?: string;
}

interface GlobalHint {
  key: string;
  order: number;
  title: string;
  description: string;
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

export function GlobalHints({ tutorialData, userId }: GlobalHintsProps) {
  const t = useTranslations("global");

  if (!userId || !tutorialData) return null;

  const tutorialManager = new TutorialManager(tutorialData);

  // Build available hints from shared configuration, adding translations
  const availableHints: GlobalHint[] = GLOBAL_HINTS_CONFIG.map((config) => {
    // Map translation keys based on hint key
    const translationKeyMap: Record<
      string,
      { title: string; description: string }
    > = {
      exhibits: {
        title: t("exhibitHintTitle"),
        description: t("exhibitHintDescription"),
      },
      creators: {
        title: t("creatorHintTitle"),
        description: t("creatorHintDescription"),
      },
      critiqueDidYouKnow: {
        title: t("critiqueDidYouKnowTitle"),
        description: t("critiqueDidYouKnowDescription"),
      },
    };

    const translations = translationKeyMap[config.key] || {
      title: "",
      description: "",
    };

    return {
      key: config.key,
      order: config.order,
      title: translations.title,
      description: translations.description,
      targetSelector: config.targetSelector,
      side: config.side,
      fixedPosition: config.fixedPosition,
      showArrow: config.showArrow,
    };
  });

  // Get the next hint to show
  const nextHintKey = tutorialManager.getNextHint(
    "global",
    availableHints.map((h) => ({ key: h.key, order: h.order })),
  );
  const nextHint = nextHintKey
    ? availableHints.find((h) => h.key === nextHintKey)
    : null;

  if (!nextHint) return null;

  return (
    <HintPopover
      hintKey={nextHint.key}
      page="global"
      title={nextHint.title}
      description={nextHint.description}
      targetSelector={nextHint.targetSelector}
      side={nextHint.side}
      shouldShow={true}
      order={nextHint.order}
      showArrow={nextHint.showArrow ?? true}
      fixedPosition={nextHint.fixedPosition}
    />
  );
}
