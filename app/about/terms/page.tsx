import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { AboutCard } from "@/components/about-card";

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
  const lastUpdatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("lastUpdated", { date: lastUpdatedDate })}
      />

      <div className="space-y-8">
        {/* Content Ownership */}
        <AboutCard>
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
        </AboutCard>

        {/* User Responsibilities */}
        <AboutCard>
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
        </AboutCard>

        {/* Service Usage */}
        <AboutCard>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            {t("serviceUsage.title")}
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>{t("serviceUsage.paragraph1")}</p>
            <p>{t("serviceUsage.paragraph2")}</p>
            <p>{t("serviceUsage.paragraph3")}</p>
          </div>
        </AboutCard>

        {/* Limitation of Liability */}
        <AboutCard>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            {t("limitationOfLiability.title")}
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>{t("limitationOfLiability.paragraph1")}</p>
            <p>{t("limitationOfLiability.paragraph2")}</p>
          </div>
        </AboutCard>

        {/* Changes to Terms */}
        <AboutCard>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            {t("changesToTerms.title")}
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>{t("changesToTerms.paragraph1")}</p>
            <p>{t("changesToTerms.paragraph2")}</p>
          </div>
        </AboutCard>

        {/* Contact */}
        <AboutCard>
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            {t("contact.title")}
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>{t("contact.paragraph1")}</p>
          </div>
        </AboutCard>
      </div>
    </PageLayout>
  );
}
