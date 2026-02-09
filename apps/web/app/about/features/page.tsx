import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { AboutCard } from "@/components/about-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutFeatures");
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

interface Feature {
  key: string;
  helpUrl: string;
}

export default async function FeaturesPage() {
  const t = await getTranslations("aboutFeatures");

  const features: Feature[] = [
    {
      key: "portfolio",
      helpUrl: "https://help.create.spot/creators/portfolio",
    },
    {
      key: "collections",
      helpUrl: "https://help.create.spot/creators/portfolio/collections",
    },
    {
      key: "socialSharing",
      helpUrl: "https://help.create.spot/creators/portfolio/social-sharing",
    },
    {
      key: "protection",
      helpUrl: "https://help.create.spot/creators/profile/setup-your-space",
    },
    {
      key: "downloads",
      helpUrl: "https://help.create.spot/creators/portfolio/downloading-work",
    },
    {
      key: "critiques",
      helpUrl: "https://help.create.spot/creators/portfolio/critiques",
    },
    {
      key: "prompts",
      helpUrl: "https://help.create.spot/inspiration/prompts",
    },
    {
      key: "museums",
      helpUrl: "https://help.create.spot/inspiration/museums",
    },
    {
      key: "exhibits",
      helpUrl: "https://help.create.spot/browsers/exhibits",
    },
    {
      key: "mapView",
      helpUrl: "https://help.create.spot/browsers/exhibits/map-view",
    },
  ];

  return (
    <PageLayout maxWidth="max-w-6xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <AboutCard
            key={feature.key}
            className="hover:shadow-md transition-shadow"
            contentClassName="p-6"
          >
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {t(`features.${feature.key}.title`)}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground mb-4">
              {t(`features.${feature.key}.description`)}
            </p>
            <a
              href={feature.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("learnMore")}
            </a>
          </AboutCard>
        ))}
      </div>
    </PageLayout>
  );
}
