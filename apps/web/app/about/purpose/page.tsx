import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { AboutCard } from "@/components/about-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutPurpose");
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

export default async function PurposePage() {
  const t = await getTranslations("aboutPurpose");
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="grid gap-8">
        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("whyCreationMatters.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("whyCreationMatters.description")}{" "}
            <strong className="text-foreground">
              {t("whyCreationMatters.humanMeaning")}
            </strong>
            {t("whyCreationMatters.ourPerspective")}{" "}
            <strong className="text-foreground">
              {t("whyCreationMatters.purpose")}
            </strong>
            .
          </p>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("aweKeepsUsAlive.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("aweKeepsUsAlive.description")}{" "}
            <strong className="text-foreground">
              {t("aweKeepsUsAlive.notice")}
            </strong>
            {t("aweKeepsUsAlive.thingsInspire")}{" "}
            <strong className="text-foreground">
              {t("aweKeepsUsAlive.creativeOutput")}
            </strong>{" "}
            {t("aweKeepsUsAlive.isJustAsImportant")}
          </p>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("creativeCycle.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            <strong className="text-foreground">
              {t("creativeCycle.observation")}
            </strong>{" "}
            {t("creativeCycle.cycleDescription")}
          </p>
        </AboutCard>
      </div>
    </PageLayout>
  );
}
