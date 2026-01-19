import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutPortfolios");
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

export default async function PortfoliosAndSharingPage() {
  const t = await getTranslations("aboutPortfolios");
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="grid gap-8">
        <Card className="rounded-3xl border-none bg-linear-to-br from-orange-50/50 to-white shadow-sm dark:from-orange-950/10 dark:to-transparent">
          <CardContent className="p-8">
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
              <div className="rounded-xl border border-orange-100/50 bg-white/50 p-4 text-sm text-muted-foreground dark:border-orange-900/20 dark:bg-black/20">
                <p className="font-semibold text-foreground">
                  {t("sharingLevels.private")}
                </p>
                <p className="mt-1">{t("sharingLevels.privateDescription")}</p>
              </div>
              <div className="rounded-xl border border-orange-100/50 bg-white/50 p-4 text-sm text-muted-foreground dark:border-orange-900/20 dark:bg-black/20">
                <p className="font-semibold text-foreground">
                  {t("sharingLevels.profile")}
                </p>
                <p className="mt-1">{t("sharingLevels.profileDescription")}</p>
              </div>
              <div className="rounded-xl border border-orange-100/50 bg-white/50 p-4 text-sm text-muted-foreground dark:border-orange-900/20 dark:bg-black/20">
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
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-pink-50/50 to-white shadow-sm dark:from-pink-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("portfolioLinks.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("portfolioLinks.description")}{" "}
              <strong className="text-foreground">
                {t("portfolioLinks.profileLink")}
              </strong>
              , and
              {t("portfolioLinks.fullDescription")}{" "}
              <strong className="text-foreground">
                {t("portfolioLinks.pieceLink")}
              </strong>
              . {t("portfolioLinks.previewDescription")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-teal-50/50 to-white shadow-sm dark:from-teal-950/10 dark:to-transparent">
          <CardContent className="p-8">
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
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-indigo-50/50 to-white shadow-sm dark:from-indigo-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("promptsAndPortfolios.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("promptsAndPortfolios.description")}
            </p>
          </CardContent>
        </Card>
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
