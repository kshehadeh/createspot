import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("terms");
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

export default async function TermsPage() {
  const t = await getTranslations("terms");
  const lastUpdatedDate = new Date("2024-01-01").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <section className="mb-14 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("pageTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground">
          {t("lastUpdated", { date: lastUpdatedDate })}
        </p>
      </section>

      <div className="space-y-8">
        {/* Content Ownership */}
        <Card className="rounded-3xl border-none bg-linear-to-br from-amber-50/50 to-white shadow-sm dark:from-amber-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              {t("contentOwnership.title")}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>{t("contentOwnership.paragraph1")}</p>
              <p>{t("contentOwnership.paragraph2")}</p>
              <p>{t("contentOwnership.paragraph3")}</p>
              <p>{t("contentOwnership.paragraph4")}</p>
              <p>{t("contentOwnership.paragraph5")}</p>
            </div>
          </CardContent>
        </Card>

        {/* User Responsibilities */}
        <Card className="rounded-3xl border-none bg-linear-to-br from-rose-50/50 to-white shadow-sm dark:from-rose-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              {t("userResponsibilities.title")}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>{t("userResponsibilities.paragraph1")}</p>
              <p>{t("userResponsibilities.paragraph2")}</p>
              <ul className="ml-6 list-disc space-y-2">
                <li>{t("userResponsibilities.bullet1")}</li>
                <li>{t("userResponsibilities.bullet2")}</li>
                <li>{t("userResponsibilities.bullet3")}</li>
                <li>{t("userResponsibilities.bullet4")}</li>
              </ul>
              <p>{t("userResponsibilities.paragraph3")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Service Usage */}
        <Card className="rounded-3xl border-none bg-linear-to-br from-sky-50/50 to-white shadow-sm dark:from-sky-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              {t("serviceUsage.title")}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>{t("serviceUsage.paragraph1")}</p>
              <p>{t("serviceUsage.paragraph2")}</p>
              <p>{t("serviceUsage.paragraph3")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card className="rounded-3xl border-none bg-linear-to-br from-violet-50/50 to-white shadow-sm dark:from-violet-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              {t("limitationOfLiability.title")}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>{t("limitationOfLiability.paragraph1")}</p>
              <p>{t("limitationOfLiability.paragraph2")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card className="rounded-3xl border-none bg-linear-to-br from-emerald-50/50 to-white shadow-sm dark:from-emerald-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              {t("changesToTerms.title")}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>{t("changesToTerms.paragraph1")}</p>
              <p>{t("changesToTerms.paragraph2")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="rounded-3xl border-none bg-linear-to-br from-indigo-50/50 to-white shadow-sm dark:from-indigo-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">
              {t("contact.title")}
            </h2>
            <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>{t("contact.paragraph1")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
