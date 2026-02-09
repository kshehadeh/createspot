import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { AboutCard } from "@/components/about-card";
import { getRoute } from "@/lib/routes";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");
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

export default async function AboutPage() {
  const t = await getTranslations("about");
  const purposeRoute = getRoute("aboutPurpose");
  const featuresRoute = getRoute("aboutFeatures");
  const promptSubmissionsRoute = getRoute("aboutPromptSubmissions");
  const museumsRoute = getRoute("aboutMuseums");

  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <PageHeader
        title={
          <>
            {t("mainTitle")}{" "}
            <span className="font-permanent-marker">
              {t("mainTitleHighlight")}
            </span>{" "}
            {t("mainTitleSuffix")}
          </>
        }
        subtitle={
          <>
            {t("mainDescription")}{" "}
            <span className="font-permanent-marker">
              {t("mainDescriptionHighlight")}
            </span>{" "}
            {t("mainDescriptionSuffix")}
          </>
        }
      />

      <div className="grid gap-8">
        <AboutCard id="purpose" className="scroll-mt-24">
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("purpose.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("purpose.description")}{" "}
            <strong className="text-foreground">{t("purpose.inspired")}</strong>{" "}
            {t("purpose.toCreateMore")}{" "}
            <strong className="text-foreground">{t("purpose.exhibit")}</strong>.{" "}
            {t("purpose.weBelieve")}{" "}
            <strong className="text-foreground">{t("purpose.sparked")}</strong>.{" "}
            {t("purpose.overTime")}{" "}
            <strong className="text-foreground">{t("purpose.building")}</strong>{" "}
            {t("purpose.fresh")}
          </p>
          <div className="mt-5">
            <Link
              href={purposeRoute.path}
              className="inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4 transition-colors hover:opacity-90"
            >
              {t("purpose.readMore")}
            </Link>
          </div>
        </AboutCard>

        <AboutCard id="features" className="scroll-mt-24">
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("features.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("features.description")}
          </p>
          <div className="mt-5">
            <Link
              href={featuresRoute.path}
              className="inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4 transition-colors hover:opacity-90"
            >
              {t("features.viewAll")}
            </Link>
          </div>
        </AboutCard>

        <AboutCard id="profile" className="scroll-mt-24">
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("profileCard.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("profileCard.description")}
          </p>
          <div className="mt-5">
            <a
              href="https://help.create.spot/creators/profile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4 transition-colors hover:opacity-90"
            >
              {t("profileCard.learnMore")}
            </a>
          </div>
        </AboutCard>

        <AboutCard id="portfolio" className="scroll-mt-24">
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("portfolioCard.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("portfolioCard.description")}
          </p>
          <div className="mt-5">
            <a
              href="https://help.create.spot/creators/portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4 transition-colors hover:opacity-90"
            >
              {t("portfolioCard.learnMore")}
            </a>
          </div>
        </AboutCard>

        <AboutCard id="prompt-inspiration" className="scroll-mt-24">
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("promptInspiration.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("promptInspiration.weeklyPrompts")}{" "}
            <strong className="text-foreground">
              {t("promptInspiration.sparkMomentum")}
            </strong>
            {t("promptInspiration.usePrompt")}{" "}
            <strong className="text-foreground">
              {t("promptInspiration.yourPortfolio")}
            </strong>
            {t("promptInspiration.soInspiration")}{" "}
            <strong className="text-foreground">
              {t("promptInspiration.stayConnected")}
            </strong>
            .
          </p>
          <div className="mt-5">
            <Link
              href={promptSubmissionsRoute.path}
              className="inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4 transition-colors hover:opacity-90"
            >
              {t("promptInspiration.learnMore")}
            </Link>
          </div>
        </AboutCard>

        <AboutCard id="museums" className="scroll-mt-24">
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("museums.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("museums.description")}{" "}
            <strong className="text-foreground">
              {t("museums.artInstitute")}
            </strong>
            {t("museums.theMuseum")}{" "}
            <strong className="text-foreground">
              {t("museums.clevelandMuseum")}
            </strong>
            {t("museums.andThe")}{" "}
            <strong className="text-foreground">
              {t("museums.nationalGallery")}
            </strong>
            .
          </p>
          <div className="mt-5">
            <Link
              href={museumsRoute.path}
              className="inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4 transition-colors hover:opacity-90"
            >
              {t("museums.learnMore")}
            </Link>
          </div>
        </AboutCard>

        <AboutCard id="badges" className="scroll-mt-24">
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("badges.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("badges.description")}{" "}
            <strong className="text-foreground">
              {t("badges.celebrateMilestones")}
            </strong>
            . {t("badges.automaticallyAwarded")}{" "}
            <strong className="text-foreground">
              {t("badges.creatingAndSharing")}
            </strong>
            .
          </p>
          <div className="mt-5">
            <a
              href="https://help.create.spot/creators/profile/badges"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4 transition-colors hover:opacity-90"
            >
              {t("badges.learnMore")}
            </a>
          </div>
        </AboutCard>

        <AboutCard id="protecting-your-work" className="scroll-mt-24">
          <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
            {t("protectingYourWork.title")}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t("protectingYourWork.description")}{" "}
            <strong className="text-foreground">
              {t("protectingYourWork.tools")}
            </strong>
            {t("protectingYourWork.continuation")}{" "}
            <strong className="text-foreground">
              {t("protectingYourWork.ownership")}
            </strong>
            .
          </p>
          <div className="mt-5">
            <a
              href="https://help.create.spot/creators/profile/setup-your-space"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-semibold text-primary underline underline-offset-4 transition-colors hover:opacity-90"
            >
              {t("protectingYourWork.learnMore")}
            </a>
          </div>
        </AboutCard>
      </div>
    </PageLayout>
  );
}
