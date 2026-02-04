import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { AboutCard } from "@/components/about-card";
import { YouTubeEmbed } from "@/components/youtube-embed";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutPortfolio");
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

export default async function AboutPortfolioPage() {
  const t = await getTranslations("aboutPortfolio");
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="mb-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <YouTubeEmbed
              videoId="WAyioJdhozU"
              title={t("videos.overviewTitle")}
              className="w-full"
            />
            <p className="text-center text-sm font-medium text-muted-foreground">
              {t("videos.overviewCaption")}
            </p>
          </div>
          <div className="space-y-2">
            <YouTubeEmbed
              videoId="K9vup2cqEbA"
              title={t("videos.progressionsTitle")}
              className="w-full"
            />
            <p className="text-center text-sm font-medium text-muted-foreground">
              {t("videos.progressionsCaption")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8">
        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("sharingLevels.title")}
          </h2>
          <p className="mb-4 text-base leading-relaxed text-muted-foreground">
            {t("sharingLevels.description")}{" "}
            <strong className="text-foreground">
              {t("sharingLevels.whoGetsToSee")}
            </strong>
            .
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">
                {t("sharingLevels.private")}
              </p>
              <p className="mt-1">{t("sharingLevels.privateDescription")}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">
                {t("sharingLevels.profile")}
              </p>
              <p className="mt-1">{t("sharingLevels.profileDescription")}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">
                {t("sharingLevels.public")}
              </p>
              <p className="mt-1">{t("sharingLevels.publicDescription")}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("sharingLevels.note")}{" "}
            <strong className="text-foreground">
              {t("sharingLevels.publicNote")}
            </strong>{" "}
            {t("sharingLevels.noteSuffix")}
          </p>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("pieceLinks.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("pieceLinks.description")}{" "}
            <strong className="text-foreground">
              {t("pieceLinks.pieceLink")}
            </strong>
            . {t("pieceLinks.previewDescription")}
          </p>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("promptsAndPortfolios.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("promptsAndPortfolios.description")}
          </p>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("collections.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("collections.description")}
          </p>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("progressions.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("progressions.description")}
          </p>
        </AboutCard>
      </div>
    </PageLayout>
  );
}
