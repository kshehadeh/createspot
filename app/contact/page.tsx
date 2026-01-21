import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SupportForm } from "@/components/contact/support-form";
import { ExhibitRequestForm } from "@/components/contact/exhibit-request-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");
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

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-8">
        {/* Support & Bug Reports */}
        <Card className="rounded-3xl border-none bg-linear-to-br from-blue-50/50 to-white shadow-sm dark:from-blue-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-2 text-2xl text-foreground font-permanent-marker">
              {t("support.title")}
            </h2>
            <p className="mb-6 text-base leading-relaxed text-muted-foreground">
              {t("support.description")}
            </p>
            <SupportForm />
          </CardContent>
        </Card>

        {/* Request for Exhibit */}
        <Card className="rounded-3xl border-none bg-linear-to-br from-purple-50/50 to-white shadow-sm dark:from-purple-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-2 text-2xl text-foreground font-permanent-marker">
              {t("exhibit.title")}
            </h2>
            <p className="mb-6 text-base leading-relaxed text-muted-foreground">
              {t("exhibit.description")}
            </p>
            <ExhibitRequestForm />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
