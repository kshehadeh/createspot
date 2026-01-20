import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
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

export default async function AboutPage() {
  const t = await getTranslations("about");
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader
        title={
          <>
            {t("mainTitle")}{" "}
            <span className="font-permanent-marker">
              {t("mainTitleHighlight")}
            </span>{" "}
            {t("mainTitleSuffix")}
          </>
        }
        subtitle={
          <>
            {t("mainDescription")}{" "}
            <span className="font-permanent-marker">
              {t("mainDescriptionHighlight")}
            </span>{" "}
            {t("mainDescriptionSuffix")}
          </>
        }
      />

      <div className="grid gap-8">
        <Card className="rounded-3xl border-none bg-linear-to-br from-amber-50/50 to-white shadow-sm dark:from-amber-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("purpose.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("purpose.description")}{" "}
              <strong className="text-foreground">
                {t("purpose.inspired")}
              </strong>{" "}
              {t("purpose.toCreateMore")}{" "}
              <strong className="text-foreground">
                {t("purpose.exhibit")}
              </strong>
              . {t("purpose.weBelieve")}{" "}
              <strong className="text-foreground">
                {t("purpose.sparked")}
              </strong>
              . {t("purpose.overTime")}{" "}
              <strong className="text-foreground">
                {t("purpose.building")}
              </strong>{" "}
              {t("purpose.fresh")}
            </p>
            <div className="mt-5">
              <Link
                href="/about/purpose"
                className="inline-flex items-center text-sm font-semibold text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-300 dark:hover:text-amber-200 underline underline-offset-4 decoration-amber-600/50 hover:decoration-amber-700"
              >
                {t("purpose.readMore")}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-rose-50/50 to-white shadow-sm dark:from-rose-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("organization.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("organization.yourPortfolioIs")}{" "}
              <strong className="text-foreground">
                {t("organization.personalSpace")}
              </strong>
              .{t("organization.youCanBuild")}{" "}
              <strong className="text-foreground">
                {t("organization.curate")}
              </strong>
              {t("organization.shareResults")}{" "}
              <strong className="text-foreground">
                {t("organization.partOfPortfolio")}
              </strong>{" "}
              {t("organization.sharedPublicly")}
            </p>
            <div className="mt-5">
              <Link
                href="/about/portfolios-and-sharing"
                className="inline-flex items-center text-sm font-semibold text-rose-600 transition-colors hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200 underline underline-offset-4 decoration-rose-600/50 hover:decoration-rose-700"
              >
                {t("organization.learnMore")}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-sky-50/50 to-white shadow-sm dark:from-sky-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("promptInspiration.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("promptInspiration.weeklyPrompts")}{" "}
              <strong className="text-foreground">
                {t("promptInspiration.sparkMomentum")}
              </strong>
              {t("promptInspiration.usePrompt")}{" "}
              <strong className="text-foreground">
                {t("promptInspiration.yourPortfolio")}
              </strong>
              {t("promptInspiration.soInspiration")}{" "}
              <strong className="text-foreground">
                {t("promptInspiration.stayConnected")}
              </strong>
              .
            </p>
            <div className="mt-5">
              <Link
                href="/about/prompt-submissions"
                className="inline-flex items-center text-sm font-semibold text-sky-700 transition-colors hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-200 underline underline-offset-4 decoration-sky-600/50 hover:decoration-sky-700"
              >
                {t("promptInspiration.learnMore")}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-violet-50/50 to-white shadow-sm dark:from-violet-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("badges.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("badges.description")}{" "}
              <strong className="text-foreground">
                {t("badges.celebrateMilestones")}
              </strong>
              . {t("badges.automaticallyAwarded")}{" "}
              <strong className="text-foreground">
                {t("badges.creatingAndSharing")}
              </strong>
              .
            </p>
            <div className="mt-5">
              <Link
                href="/about/badges"
                className="inline-flex items-center text-sm font-semibold text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200 underline underline-offset-4 decoration-violet-600/50 hover:decoration-violet-700"
              >
                {t("badges.learnMore")}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-emerald-50/50 to-white shadow-sm dark:from-emerald-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("protectingYourWork.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("protectingYourWork.description")}{" "}
              <strong className="text-foreground">
                {t("protectingYourWork.tools")}
              </strong>
              {t("protectingYourWork.continuation")}{" "}
              <strong className="text-foreground">
                {t("protectingYourWork.ownership")}
              </strong>
              .
            </p>
            <div className="mt-5">
              <Link
                href="/about/protecting-your-work"
                className="inline-flex items-center text-sm font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200 underline underline-offset-4 decoration-emerald-600/50 hover:decoration-emerald-700"
              >
                {t("protectingYourWork.learnMore")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
