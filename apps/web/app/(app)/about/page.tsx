import type { Metadata } from "next";
import Link from "@/components/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getCreatorUrl } from "@/lib/utils";
import { getObjectPositionStyle } from "@/lib/image-utils";
import { getHomepageHeroData } from "@/lib/homepage-hero";
import { PageLayout } from "@/components/page-layout";
import { AboutCard } from "@/components/about-card";
import { getRoute } from "@/lib/routes";
import { Button } from "@createspot/ui-primitives/button";
import {
  ArrowRight,
  ExternalLink,
  Sparkles,
  Target,
} from "lucide-react";
import { RecentSubmissionsCarousel } from "@/components/recent-submissions-carousel";
import { AboutScrollSection } from "@/components/about-scroll-section";

interface Feature {
  key: string;
  helpUrl: string;
  screenshotSrc: string;
  hasScreenshot: boolean;
}

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
  const [tAbout, tHome, tPurpose, tFeatures, heroData, session] =
    await Promise.all([
      getTranslations("about"),
      getTranslations("home"),
      getTranslations("aboutPurpose"),
      getTranslations("aboutFeatures"),
      getHomepageHeroData(),
      auth(),
    ]);

  const changelogRoute = getRoute("aboutChangelog");
  const termsRoute = getRoute("terms");

  const features: Feature[] = [
    {
      key: "portfolio",
      helpUrl: "https://help.create.spot/creators/portfolio",
      screenshotSrc: "/images/about/dashboard.png",
      hasScreenshot: true,
    },
    {
      key: "collections",
      helpUrl: "https://help.create.spot/creators/portfolio/collections",
      screenshotSrc: "/images/about/feature-placeholder.svg",
      hasScreenshot: false,
    },
    {
      key: "socialSharing",
      helpUrl: "https://help.create.spot/creators/portfolio/social-sharing",
      screenshotSrc: "/images/about/feature-placeholder.svg",
      hasScreenshot: false,
    },
    {
      key: "protection",
      helpUrl: "https://help.create.spot/creators/profile/setup-your-space",
      screenshotSrc: "/images/about/profile-edit.png",
      hasScreenshot: true,
    },
    {
      key: "downloads",
      helpUrl: "https://help.create.spot/creators/portfolio/downloading-work",
      screenshotSrc: "/images/about/feature-placeholder.svg",
      hasScreenshot: false,
    },
    {
      key: "critiques",
      helpUrl: "https://help.create.spot/creators/portfolio/critiques",
      screenshotSrc: "/images/about/feature-placeholder.svg",
      hasScreenshot: false,
    },
    {
      key: "prompts",
      helpUrl: "https://help.create.spot/inspiration/prompts",
      screenshotSrc: "/images/about/this-week-gallery.png",
      hasScreenshot: true,
    },
    {
      key: "exhibits",
      helpUrl: "https://help.create.spot/browsers/exhibits",
      screenshotSrc: "/images/about/exhibit-grid.png",
      hasScreenshot: true,
    },
    {
      key: "mapView",
      helpUrl: "https://help.create.spot/browsers/exhibits/map-view",
      screenshotSrc: "/images/about/exhibit-map.png",
      hasScreenshot: true,
    },
  ];

  return (
    <>
      <section className="relative min-h-[360px] w-full overflow-hidden sm:min-h-[440px] lg:min-h-[540px]">
        <div className="absolute inset-0 hero-background" />
        {heroData.type === "carousel" && heroData.submissions.length > 0 ? (
          <RecentSubmissionsCarousel
            submissions={heroData.submissions.map((submission) => ({
              ...submission,
              imageFocalPoint: submission.imageFocalPoint as {
                x: number;
                y: number;
              } | null,
            }))}
            className="absolute inset-0"
            viewportClassName="rounded-none"
            imageSizes="100vw"
          />
        ) : heroData.type === "hero" ? (
          <Link
            href={`${getCreatorUrl(heroData.submission.user)}/s/${heroData.submission.id}`}
            className="absolute inset-0 block overflow-hidden bg-muted"
          >
            <Image
              src={heroData.submission.imageUrl!}
              alt={heroData.submission.title || "Creative work"}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105"
              sizes="100vw"
              style={{
                objectPosition: getObjectPositionStyle(
                  heroData.submission.imageFocalPoint as {
                    x: number;
                    y: number;
                  } | null,
                ),
              }}
            />
          </Link>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />
        <div className="relative mx-auto flex h-full max-w-6xl items-center px-6 py-16 sm:py-24 lg:py-28">
          <div className="max-w-2xl text-left">
            <h1 className="mb-6 text-5xl font-semibold tracking-tight text-white drop-shadow-sm sm:text-7xl">
              {tHome("heroTitle")}{" "}
              <span className="block bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400 bg-clip-text text-transparent font-permanent-marker">
                {tHome("heroTitleHighlight")}
              </span>
            </h1>
            <p className="max-w-2xl text-lg text-white/80 sm:text-xl">
              {tHome("heroDescription")}
            </p>
          </div>
        </div>
      </section>

      <PageLayout maxWidth="max-w-6xl" className="space-y-10 py-10 sm:py-16">
        <section className="sticky top-[3.5rem] z-20 rounded-2xl border border-border/60 bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="flex flex-wrap gap-2">
            <a
              href="#purpose"
              className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80"
            >
              Purpose
            </a>
            <a
              href="#features"
              className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80"
            >
              Features
            </a>
            <a
              href="#protecting-your-work"
              className="rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80"
            >
              Protection
            </a>
          </div>
        </section>

        <AboutScrollSection id="purpose">
          <AboutCard className="border-border/60">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/15 p-2 text-amber-500 dark:bg-amber-400/15 dark:text-amber-300">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="text-3xl font-permanent-marker text-foreground">
                {tAbout("purpose.title")}
              </h2>
            </div>
            <p className="text-base leading-relaxed text-muted-foreground">
              {tPurpose("whyCreationMatters.description")}{" "}
              <strong className="text-foreground">
                {tPurpose("whyCreationMatters.humanMeaning")}
              </strong>
              {tPurpose("whyCreationMatters.ourPerspective")}{" "}
              <strong className="text-foreground">
                {tPurpose("whyCreationMatters.purpose")}
              </strong>
              . {tPurpose("aweKeepsUsAlive.description")}{" "}
              <strong className="text-foreground">
                {tPurpose("aweKeepsUsAlive.notice")}
              </strong>
              {tPurpose("aweKeepsUsAlive.thingsInspire")}{" "}
              <strong className="text-foreground">
                {tPurpose("aweKeepsUsAlive.creativeOutput")}
              </strong>{" "}
              {tPurpose("aweKeepsUsAlive.isJustAsImportant")}
            </p>
          </AboutCard>
        </AboutScrollSection>

        <AboutScrollSection id="features">
          <AboutCard className="border-border/60" contentClassName="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/15 p-2 text-violet-500 dark:bg-violet-400/15 dark:text-violet-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-3xl font-permanent-marker text-foreground">
                {tAbout("features.title")}
              </h2>
            </div>
            <p className="mb-6 text-base text-muted-foreground">
              {tFeatures("mainDescription")}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.key}
                  className="rounded-2xl border border-border/70 bg-card/40 p-4"
                >
                  <div className="mb-3 overflow-hidden rounded-xl border border-border bg-muted/40">
                    <img
                      src={feature.screenshotSrc}
                      alt={`${tFeatures(`features.${feature.key}.title`)} screenshot`}
                      className="h-44 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="mb-1 text-base font-semibold text-foreground">
                    {tFeatures(`features.${feature.key}.title`)}
                  </h3>
                  <p className="mb-3 text-sm text-muted-foreground">
                    {tFeatures(`features.${feature.key}.description`)}
                  </p>
                  {!feature.hasScreenshot && (
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      Screenshot coming soon
                    </p>
                  )}
                  <a
                    href={feature.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    {tFeatures("learnMore")}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </AboutCard>
        </AboutScrollSection>

        <AboutScrollSection id="protecting-your-work">
          <AboutCard className="border-border/60">
            <h2 className="mb-4 text-3xl font-permanent-marker text-foreground">
              {tAbout("protectingYourWork.title")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {tAbout("protectingYourWork.description")}{" "}
              <strong className="text-foreground">
                {tAbout("protectingYourWork.tools")}
              </strong>
              {tAbout("protectingYourWork.continuation")}{" "}
              <strong className="text-foreground">
                {tAbout("protectingYourWork.ownership")}
              </strong>
              .
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <a
                  href="https://help.create.spot/creators/profile/setup-your-space"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tAbout("protectingYourWork.learnMore")}
                </a>
              </Button>
              <Button asChild variant="outline">
                <Link href={changelogRoute.path}>View updates</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={termsRoute.path}>Read terms</Link>
              </Button>
            </div>
          </AboutCard>
        </AboutScrollSection>

        <AboutScrollSection id="cta">
          <AboutCard className="border-border/60 bg-gradient-to-br from-primary/10 via-card to-card">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              Build momentum with every piece you share.
            </h2>
            <p className="mb-6 text-muted-foreground">
              Create a portfolio, exhibit your work, and keep your creative
              cycle moving.
            </p>
            <div className="flex flex-wrap gap-3">
              {session?.user ? (
                <Button asChild>
                  <Link href={`${getCreatorUrl(session.user)}/portfolio`}>
                    {tHome("highlights.portfolios.ctaView")}
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/api/auth/signin">
                    {tHome("highlights.portfolios.ctaSignIn")}
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/inspire/exhibition">
                  {tHome("highlights.exhibits.cta")}
                </Link>
              </Button>
            </div>
          </AboutCard>
        </AboutScrollSection>
      </PageLayout>
    </>
  );
}
