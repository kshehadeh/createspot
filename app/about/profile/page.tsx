import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { AboutCard } from "@/components/about-card";
import { YouTubeEmbed } from "@/components/youtube-embed";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutProfile");
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

export default async function AboutProfilePage() {
  const t = await getTranslations("aboutProfile");
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="mb-8">
        <YouTubeEmbed videoId="tp6sg90IpAw" title={t("videoTitle")} />
      </div>

      <div className="grid gap-8">
        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("profileLink.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("profileLink.description")}{" "}
            <strong className="text-foreground">
              {t("profileLink.profileLink")}
            </strong>
            . {t("profileLink.previewDescription")}
          </p>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("featuredWork.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("featuredWork.description")}{" "}
            <strong className="text-foreground">
              {t("featuredWork.featuredSubmission")}
            </strong>{" "}
            {t("featuredWork.fullDescription")}{" "}
            <strong className="text-foreground">
              {t("featuredWork.profileOrPublic")}
            </strong>{" "}
            {t("featuredWork.or")}{" "}
            <strong className="text-foreground">
              {t("featuredWork.public")}
            </strong>
            .
          </p>
        </AboutCard>
      </div>
    </PageLayout>
  );
}
