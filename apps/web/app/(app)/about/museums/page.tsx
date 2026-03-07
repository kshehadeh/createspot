import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { AboutCard } from "@/components/about-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutMuseums");
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

export default async function MuseumsAboutPage() {
  const t = await getTranslations("aboutMuseums");
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="grid gap-8">
        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("dataSources.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground mb-4">
            {t("dataSources.description")}
          </p>
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-2">
              <span className="shrink-0 mt-1 text-primary">•</span>
              <span>
                <strong className="text-foreground">
                  {t("dataSources.artic")}
                </strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 mt-1 text-primary">•</span>
              <span>
                <strong className="text-foreground">
                  {t("dataSources.cleveland")}
                </strong>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 mt-1 text-primary">•</span>
              <span>
                <strong className="text-foreground">
                  {t("dataSources.nga")}
                </strong>
              </span>
            </li>
          </ul>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("searching.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground mb-4">
            {t("searching.description")}
          </p>
          <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li className="flex gap-2">
              <span className="shrink-0 mt-1 text-primary">•</span>
              <span>
                <strong className="text-foreground">
                  {t("searching.keywordSearch")}
                </strong>{" "}
                {t("searching.keywordSearchDescription")}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 mt-1 text-primary">•</span>
              <span>
                <strong className="text-foreground">
                  {t("searching.museumFilter")}
                </strong>{" "}
                {t("searching.museumFilterDescription")}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 mt-1 text-primary">•</span>
              <span>
                <strong className="text-foreground">
                  {t("searching.artistFilter")}
                </strong>{" "}
                {t("searching.artistFilterDescription")}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 mt-1 text-primary">•</span>
              <span>
                <strong className="text-foreground">
                  {t("searching.mediumFilter")}
                </strong>{" "}
                {t("searching.mediumFilterDescription")}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 mt-1 text-primary">•</span>
              <span>
                <strong className="text-foreground">
                  {t("searching.styleFilter")}
                </strong>{" "}
                {t("searching.styleFilterDescription")}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="shrink-0 mt-1 text-primary">•</span>
              <span>
                <strong className="text-foreground">
                  {t("searching.dateRange")}
                </strong>{" "}
                {t("searching.dateRangeDescription")}
              </span>
            </li>
          </ul>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("browsing.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("browsing.description")}
          </p>
        </AboutCard>

        <AboutCard>
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("openAccess.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("openAccess.description")}{" "}
            <strong className="text-foreground">
              {t("openAccess.openAccessPrograms")}
            </strong>
            {t("openAccess.continuation")}
          </p>
        </AboutCard>
      </div>
    </PageLayout>
  );
}
