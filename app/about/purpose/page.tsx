import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
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
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="grid gap-8">
        <Card className="about-card-emerald rounded-3xl border-none shadow-sm">
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

        <Card className="about-card-violet rounded-3xl border-none shadow-sm">
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

        <Card className="about-card-indigo rounded-3xl border-none shadow-sm">
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
