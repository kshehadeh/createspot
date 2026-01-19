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
  className?: string;
}

export function ProfileBadges({ badgeAwards, className }: ProfileBadgesProps) {
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
    <div className={`px-4 py-3 rounded-lg bg-muted/50 ${className || ""}`}>
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap justify-center gap-3">
          {badgesWithDefinitions.map(({ award, definition }) => (
            <Tooltip key={award.badgeKey}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1.5 cursor-help">
                  <div className="relative w-12 h-12 md:w-14 md:h-14">
                    <Image
                      src={definition.image}
                      alt={definition.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 48px, 56px"
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium mb-1">
                    {t(getBadgeTranslationKey(award.badgeKey))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(getBadgeDescriptionKey(award.badgeKey))}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
