"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { badgeDefinitionsByKey } from "@/lib/badges";
import type { BadgeKey } from "@/lib/badges";

interface BadgeAward {
  badgeKey: string;
  awardedAt: Date;
}

interface ProfileBadgesProps {
  badgeAwards: BadgeAward[];
}

export function ProfileBadges({ badgeAwards }: ProfileBadgesProps) {
  const t = useTranslations("badgeAward");
  if (badgeAwards.length === 0) {
    return null;
  }

  const badgesWithDefinitions = badgeAwards
    .map((award) => {
      const definition = badgeDefinitionsByKey[award.badgeKey as BadgeKey];
      if (!definition) return null;
      return {
        award,
        definition,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (badgesWithDefinitions.length === 0) {
    return null;
  }

  const getBadgeTranslationKey = (badgeKey: string): string => {
    switch (badgeKey) {
      case "first_portfolio_submission":
        return "aspiringCreator";
      case "first_prompt_submission":
        return "promptPioneer";
      case "first_critique_received":
        return "featuredVoice";
      case "first_critique_given":
        return "artfulEye";
      default:
        return badgeKey;
    }
  };

  const getBadgeDescriptionKey = (badgeKey: string): string => {
    return `${getBadgeTranslationKey(badgeKey)}Description`;
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-foreground mb-4">
        {t("title")}
      </h2>
      <TooltipProvider delayDuration={300}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badgesWithDefinitions.map(({ award, definition }) => (
            <Tooltip key={award.badgeKey}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-2 cursor-help">
                  <div className="relative w-20 h-20 md:w-24 md:h-24">
                    <Image
                      src={definition.image}
                      alt={definition.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 80px, 96px"
                    />
                  </div>
                  <p className="text-sm font-medium text-foreground text-center">
                    {t(getBadgeTranslationKey(award.badgeKey))}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t(getBadgeDescriptionKey(award.badgeKey))}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
