import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { AboutCard } from "@/components/about-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutPromptSubmissions");
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

export default async function PromptSubmissionsPage() {
  const t = await getTranslations("aboutPromptSubmissions");
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="grid gap-8">
        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("whatYouCanSubmit.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("whatYouCanSubmit.description")}{" "}
            <strong className="text-foreground">
              {t("whatYouCanSubmit.visualOrText")}
            </strong>
            . {t("whatYouCanSubmit.fullDescription")}
          </p>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("titlesInGallery.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("titlesInGallery.description")}{" "}
            <strong className="text-foreground">
              {t("titlesInGallery.titleWord")}
            </strong>{" "}
            {t("titlesInGallery.fullDescription")}
          </p>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("clearingRemoving.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("clearingRemoving.description")}{" "}
            <strong className="text-foreground">
              {t("clearingRemoving.clearAll")}
            </strong>{" "}
            {t("clearingRemoving.forCurrentPrompt")}{" "}
            <strong className="text-foreground">
              {t("clearingRemoving.removeIndividual")}
            </strong>{" "}
            {t("clearingRemoving.fullDescription")}
          </p>
        </AboutCard>
      </div>
    </PageLayout>
  );
}
