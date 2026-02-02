"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { HintPopover } from "@/components/hint-popover";
import { TutorialManager } from "@/lib/tutorial-manager";
import { getPageHintsConfig } from "@/lib/hints-config";

interface GlobalHintsProps {
  tutorialData: any;
  userId?: string;
}

export function GlobalHints({ tutorialData, userId }: GlobalHintsProps) {
  const t = useTranslations("global");

  if (!userId || !tutorialData) return null;

  const tutorialManager = new TutorialManager(tutorialData);

  // Get hints from centralized config and resolve translations
  const availableHints = useMemo(() => {
    const hintConfigs = getPageHintsConfig("global");
    return hintConfigs.map((hint) => ({
      key: hint.key,
      order: hint.order,
      title: t(hint.translationKeys.title),
      description: t(hint.translationKeys.description),
      targetSelector: hint.targetSelector,
      side: hint.side,
      fixedPosition: hint.fixedPosition,
      showArrow: hint.showArrow,
    }));
  }, [t]);

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
