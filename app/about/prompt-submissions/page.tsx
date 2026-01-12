import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("aboutPromptSubmissions");
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

export default async function PromptSubmissionsPage() {
  const t = await getTranslations("aboutPromptSubmissions");
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <section className="mb-12 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {t("aboutPrompts")}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("mainTitle")}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {t("mainDescription")}
        </p>
      </section>

      <div className="grid gap-8">
        <Card className="rounded-3xl border-none bg-linear-to-br from-fuchsia-50/50 to-white shadow-sm dark:from-fuchsia-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("whatYouCanSubmit.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("whatYouCanSubmit.description")}{" "}
              <strong className="text-foreground">
                {t("whatYouCanSubmit.visualOrText")}
              </strong>
              . {t("whatYouCanSubmit.fullDescription")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-violet-50/50 to-white shadow-sm dark:from-violet-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("titlesInGallery.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("titlesInGallery.description")}{" "}
              <strong className="text-foreground">
                {t("titlesInGallery.titleWord")}
              </strong>{" "}
              {t("titlesInGallery.fullDescription")}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-cyan-50/50 to-white shadow-sm dark:from-cyan-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              {t("clearingRemoving.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("clearingRemoving.description")}{" "}
              <strong className="text-foreground">
                {t("clearingRemoving.clearAll")}
              </strong>{" "}
              {t("clearingRemoving.forCurrentPrompt")}{" "}
              <strong className="text-foreground">
                {t("clearingRemoving.removeIndividual")}
              </strong>{" "}
              {t("clearingRemoving.fullDescription")}
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
