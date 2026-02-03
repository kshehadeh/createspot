import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { AboutCard } from "@/components/about-card";
import { YouTubeEmbed } from "@/components/youtube-embed";

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

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <YouTubeEmbed videoId="g4zZS0NF4dw" title={t("video1Title")} />
          <p className="text-sm font-medium text-foreground text-center">
            {t("video1Title")}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <YouTubeEmbed videoId="oFuct1lXSB4" title={t("video2Title")} />
          <p className="text-sm font-medium text-foreground text-center">
            {t("video2Title")}
          </p>
        </div>
      </div>

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
            {t("contextBySelection.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("contextBySelection.description")}
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
