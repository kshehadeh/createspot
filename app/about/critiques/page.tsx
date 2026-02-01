import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { AboutCard } from "@/components/about-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutCritiques");
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

export default async function AboutCritiquesPage() {
  const t = await getTranslations("aboutCritiques");

  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="grid gap-8">
        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("requesting.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("requesting.description")}
          </p>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("replying.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("replying.description")}
          </p>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("controls.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("controls.description")}
          </p>
        </AboutCard>
      </div>
    </PageLayout>
  );
}
