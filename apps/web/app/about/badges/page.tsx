import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { AboutCard } from "@/components/about-card";
import { badgeDefinitions } from "@/lib/badges";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutBadges");
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
  };
}

export default async function BadgesPage() {
  const t = await getTranslations("aboutBadges");
  const tBadge = await getTranslations("badgeAward");

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

  const getHowToEarnKey = (badgeKey: string): string => {
    switch (badgeKey) {
      case "first_portfolio_submission":
        return "howToEarnAspiringCreator";
      case "first_prompt_submission":
        return "howToEarnPromptPioneer";
      case "first_critique_received":
        return "howToEarnFeaturedVoice";
      case "first_critique_given":
        return "howToEarnArtfulEye";
      default:
        return "howToEarn";
    }
  };

  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="grid gap-8">
        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("howBadgesWork.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("howBadgesWork.description")}{" "}
            <strong className="text-foreground">
              {t("howBadgesWork.automaticallyAwarded")}
            </strong>
            . {t("howBadgesWork.displayed")}{" "}
            <strong className="text-foreground">
              {t("howBadgesWork.profilePage")}
            </strong>
            . {t("howBadgesWork.emailNotification")}
          </p>
        </AboutCard>

        <div className="grid gap-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("allBadges")}
          </h2>
          {badgeDefinitions.map((badge) => {
            const translationKey = getBadgeTranslationKey(badge.key);
            const howToEarnKey = getHowToEarnKey(badge.key);
            return (
              <AboutCard key={badge.key}>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-shrink-0">
                    <div className="relative w-32 h-32">
                      <Image
                        src={badge.image}
                        alt={tBadge(translationKey)}
                        fill
                        className="object-contain"
                        sizes="128px"
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="mb-2 text-2xl font-semibold text-foreground">
                      {tBadge(translationKey)}
                    </h3>
                    <p className="mb-4 text-base text-muted-foreground">
                      {tBadge(`${translationKey}Description`)}
                    </p>
                    <div className="rounded-xl border border-border bg-muted/50 p-4">
                      <p className="text-sm font-semibold text-foreground mb-1">
                        {t("howToEarn")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t(howToEarnKey)}
                      </p>
                    </div>
                  </div>
                </div>
              </AboutCard>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
