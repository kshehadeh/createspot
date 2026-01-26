import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutProtectingYourWork");
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

export default async function ProtectingYourWorkPage() {
  const t = await getTranslations("aboutProtectingYourWork");
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="grid gap-8">
        <Card className="about-card-violet rounded-3xl border-none shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("theAgeOfAI.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("theAgeOfAI.description")}{" "}
              <strong className="text-foreground">
                {t("theAgeOfAI.highlight1")}
              </strong>
              {t("theAgeOfAI.continuation")}{" "}
              <strong className="text-foreground">
                {t("theAgeOfAI.highlight2")}
              </strong>
              {t("theAgeOfAI.ending")}
            </p>
          </CardContent>
        </Card>

        <Card className="about-card-amber rounded-3xl border-none shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("howWeProtect.title")}
            </h2>
            <p className="mb-4 text-base leading-relaxed text-muted-foreground">
              {t("howWeProtect.description")}
            </p>
            <ul className="space-y-3 text-base leading-relaxed text-muted-foreground">
              <li className="flex gap-3">
                <span className="mt-1 flex-shrink-0 text-amber-600 dark:text-amber-400">
                  •
                </span>
                <span>
                  <strong className="text-foreground">
                    {t("howWeProtect.watermarking")}
                  </strong>{" "}
                  {t("howWeProtect.watermarkingDescription")}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex-shrink-0 text-amber-600 dark:text-amber-400">
                  •
                </span>
                <span>
                  <strong className="text-foreground">
                    {t("howWeProtect.downloadDeterrents")}
                  </strong>{" "}
                  {t("howWeProtect.downloadDeterrentsDescription")}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 flex-shrink-0 text-amber-600 dark:text-amber-400">
                  •
                </span>
                <span>
                  <strong className="text-foreground">
                    {t("howWeProtect.aiOptOut")}
                  </strong>{" "}
                  {t("howWeProtect.aiOptOutDescription")}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="about-card-emerald rounded-3xl border-none shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("humanVsGenerated.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("humanVsGenerated.description")}{" "}
              <strong className="text-foreground">
                {t("humanVsGenerated.highlight1")}
              </strong>
              {t("humanVsGenerated.continuation")}{" "}
              <strong className="text-foreground">
                {t("humanVsGenerated.highlight2")}
              </strong>
              {t("humanVsGenerated.ending")}
            </p>
          </CardContent>
        </Card>

        <Card className="about-card-sky rounded-3xl border-none shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("yourWorkYourRights.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("yourWorkYourRights.description")}{" "}
              <strong className="text-foreground">
                {t("yourWorkYourRights.highlight")}
              </strong>
              {t("yourWorkYourRights.continuation")}{" "}
              <Link
                href="/about/terms"
                className="font-medium text-foreground underline underline-offset-4 decoration-muted-foreground/30 transition-colors hover:decoration-foreground"
              >
                {t("yourWorkYourRights.termsLink")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
