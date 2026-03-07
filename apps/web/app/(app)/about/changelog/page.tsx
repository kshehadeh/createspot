import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { PageLayout } from "@/components/page-layout";
import { ChangelogClient } from "./changelog-client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutChangelog");
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

export default async function AboutChangelogPage() {
  const t = await getTranslations("aboutChangelog");

  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />
      <ChangelogClient initialLimit={10} />
    </PageLayout>
  );
}
