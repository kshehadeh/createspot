import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

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

export default async function FeaturesPage() {
  const t = await getTranslations("aboutFeatures");

  const features = [
    { key: "portfolio" },
    { key: "collections" },
    { key: "socialSharing" },
    { key: "protection" },
    { key: "downloads" },
    { key: "critiques" },
    { key: "prompts" },
    { key: "exhibits" },
    { key: "mapView" },
  ];

  return (
    <PageLayout maxWidth="max-w-6xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.key}
            className="about-card-indigo rounded-3xl border-none shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {t(`features.${feature.key}.title`)}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t(`features.${feature.key}.description`)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  );
}
