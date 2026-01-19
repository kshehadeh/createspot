import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
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

  const badgeColors = [
    "from-blue-50/50 to-white dark:from-blue-950/10 dark:to-transparent",
    "from-emerald-50/50 to-white dark:from-emerald-950/10 dark:to-transparent",
    "from-amber-50/50 to-white dark:from-amber-950/10 dark:to-transparent",
    "from-purple-50/50 to-white dark:from-purple-950/10 dark:to-transparent",
  ];

  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="grid gap-8">
        <Card className="rounded-3xl border-none bg-linear-to-br from-slate-50/50 to-white shadow-sm dark:from-slate-950/10 dark:to-transparent">
          <CardContent className="p-8">
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
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("allBadges")}
          </h2>
          {badgeDefinitions.map((badge, index) => {
            const translationKey = getBadgeTranslationKey(badge.key);
            const howToEarnKey = getHowToEarnKey(badge.key);
            return (
              <Card
                key={badge.key}
                className={`rounded-3xl border-none bg-linear-to-br ${badgeColors[index % badgeColors.length]} shadow-sm`}
              >
                <CardContent className="p-8">
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
                      <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                        <p className="text-sm font-semibold text-foreground mb-1">
                          {t("howToEarn")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t(howToEarnKey)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/about"
          className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground underline underline-offset-4 decoration-muted-foreground/30"
        >
          {t("backToAbout")}
        </Link>
      </div>
    </PageLayout>
  );
}
