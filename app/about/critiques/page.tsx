import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutCritiques");
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

export default async function AboutCritiquesPage() {
  const t = await getTranslations("aboutCritiques");

  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("mainTitle")} subtitle={t("mainDescription")} />

      <div className="grid gap-8">
        <Card className="about-card-blue rounded-3xl border-none shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("requesting.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("requesting.description")}
            </p>
          </CardContent>
        </Card>

        <Card className="about-card-purple rounded-3xl border-none shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("replying.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("replying.description")}
            </p>
          </CardContent>
        </Card>

        <Card className="about-card-orange rounded-3xl border-none shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("controls.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("controls.description")}
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
