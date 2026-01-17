"use client";

import { useTranslations } from "next-intl";
import { HintPopover } from "@/components/hint-popover";
import { TutorialManager } from "@/lib/tutorial-manager";

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

  // Define available global hints with their order and configuration
  const availableHints: GlobalHint[] = [
    {
      key: "exhibits",
      order: 1,
      title: t("exhibitHintTitle"),
      description: t("exhibitHintDescription"),
      targetSelector: "a[href='/exhibition']",
      side: "bottom",
      showArrow: true,
    },
    {
      key: "creators",
      order: 2,
      title: t("creatorHintTitle"),
      description: t("creatorHintDescription"),
      targetSelector: "a[href='/creators']",
      side: "bottom",
      showArrow: true,
    },
    // Add "Did You Know" hints here as needed
    // Example:
    // {
    //   key: "didYouKnow1",
    //   order: 3,
    //   title: t("didYouKnow1Title"),
    //   description: t("didYouKnow1Description"),
    //   fixedPosition: { bottom: 24, right: 24 },
    //   showArrow: false,
    // },
  ];

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
