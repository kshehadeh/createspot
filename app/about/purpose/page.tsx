import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";

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
      <section className="mb-12 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {t("whyWeCreate")}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("mainTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {t("mainDescription")}
        </p>
      </section>

      <div className="grid gap-8">
        <Card className="rounded-3xl border-none bg-linear-to-br from-emerald-50/50 to-white shadow-sm dark:from-emerald-950/10 dark:to-transparent">
          <CardContent className="p-8">
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
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-violet-50/50 to-white shadow-sm dark:from-violet-950/10 dark:to-transparent">
          <CardContent className="p-8">
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
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-indigo-50/50 to-white shadow-sm dark:from-indigo-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("creativeCycle.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              <strong className="text-foreground">
                {t("creativeCycle.observation")}
              </strong>{" "}
              {t("creativeCycle.cycleDescription")}
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
