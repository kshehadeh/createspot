import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getCreatorUrl } from "@/lib/utils";
import { getObjectPositionStyle } from "@/lib/image-utils";
import { getHomepageHeroData } from "@/lib/homepage-hero";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { AboutCard } from "@/components/about-card";
import { getRoute } from "@/lib/routes";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  FolderOpen,
  Landmark,
  LayoutGrid,
  Lightbulb,
  MessageCircle,
  Share2,
  Users,
} from "lucide-react";
import { RecentSubmissionsCarousel } from "@/components/recent-submissions-carousel";

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
  const [tAbout, tHome, heroData, session] = await Promise.all([
    getTranslations("about"),
    getTranslations("home"),
    getHomepageHeroData(),
    auth(),
  ]);

  const purposeRoute = getRoute("aboutPurpose");
  const featuresRoute = getRoute("aboutFeatures");
  const promptSubmissionsRoute = getRoute("aboutPromptSubmissions");
  const museumsRoute = getRoute("aboutMuseums");

  const t = tAbout;

  return (
    <>
      {/* Hero Section - contained in content area (no overlap with sidebar) */}
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

      <PageLayout maxWidth="max-w-6xl" className="sm:py-16">
        {/* Feature Highlights */}
        <section className="relative z-10 -mt-16 px-0">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="group overflow-hidden border-border/60 bg-card/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-500/30 dark:from-emerald-400/15 dark:to-teal-400/15 dark:ring-emerald-400/25">
                      <Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
                        {tHome("highlights.portfolios.title")}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                        {tHome("highlights.portfolios.description")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  {session?.user ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Link href={`${getCreatorUrl(session.user)}/portfolio`}>
                        {tHome("highlights.portfolios.ctaView")}
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Link href="/api/auth/signin">
                        {tHome("highlights.portfolios.ctaSignIn")}
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="group overflow-hidden border-border/60 bg-card/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 ring-1 ring-sky-500/30 dark:from-sky-400/15 dark:to-indigo-400/15 dark:ring-sky-400/25">
                      <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
                        {tHome("highlights.community.title")}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                        {tHome("highlights.community.description")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Link href="/inspire/community">
                      {tHome("highlights.community.cta")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="group overflow-hidden border-border/60 bg-card/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 ring-1 ring-amber-500/30 dark:from-amber-400/15 dark:to-rose-400/15 dark:ring-amber-400/25">
                      <Landmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
                        {tHome("highlights.museums.title")}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                        {tHome("highlights.museums.description")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Link href="/inspire/museums">
                      {tHome("highlights.museums.cta")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="group overflow-hidden border-border/60 bg-card/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1 ring-violet-500/30 dark:from-violet-400/15 dark:to-fuchsia-400/15 dark:ring-violet-400/25">
                      <LayoutGrid className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
                        {tHome("highlights.exhibits.title")}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                        {tHome("highlights.exhibits.description")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-0">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Link href="/inspire/exhibition">
                      {tHome("highlights.exhibits.cta")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Mission Statement Section */}
        <section className="px-0 pb-12 pt-10 sm:pb-16">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-3xl font-medium leading-relaxed text-foreground/80 sm:text-4xl sm:leading-relaxed md:text-5xl md:leading-relaxed lg:text-6xl lg:leading-relaxed">
              {tHome("missionStatement")}{" "}
              <strong className="rainbow-sheen">
                {tHome("missionExhibit")}
              </strong>
              , find inspiration to{" "}
              <strong className="rainbow-sheen">
                {tHome("missionCreate")}
              </strong>
              , and{" "}
              <strong className="rainbow-sheen">
                {tHome("missionSupport")}
              </strong>
              .
            </p>
          </div>
        </section>

        {/* Feature Quadrants */}
        <section className="border-t border-border/50 bg-muted/30 px-0 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="group relative h-full overflow-hidden border-border/60 bg-card/80 shadow-sm">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 ring-1 ring-amber-500/30 dark:from-amber-400/15 dark:to-rose-400/15 dark:ring-amber-400/25">
                      <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <CardTitle className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      {tHome("features.inspiration.title")}
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {tHome("features.inspiration.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0">
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href="/inspire/exhibition"
                      className="text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                    >
                      {tHome("features.inspiration.ctaExhibits")}
                    </Link>
                    <Link
                      href="/about/prompt-submissions"
                      className="text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                    >
                      {tHome("features.inspiration.ctaAboutPrompts")}
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative h-full overflow-hidden border-border/60 bg-card/80 shadow-sm">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 ring-1 ring-sky-500/30 dark:from-sky-400/15 dark:to-indigo-400/15 dark:ring-sky-400/25">
                      <MessageCircle className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                    </div>
                    <CardTitle className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      {tHome("features.critique.title")}
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {tHome("features.critique.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0">
                  <Link
                    href="/about/critiques"
                    className="text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                  >
                    {tHome("features.critique.ctaLearnMore")}
                  </Link>
                </CardContent>
              </Card>

              <Card className="group relative h-full overflow-hidden border-border/60 bg-card/80 shadow-sm">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1 ring-violet-500/30 dark:from-violet-400/15 dark:to-fuchsia-400/15 dark:ring-violet-400/25">
                      <Share2 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <CardTitle className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      {tHome("features.exposure.title")}
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {tHome("features.exposure.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0">
                  <Link
                    href="/about/features"
                    className="text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                  >
                    {tHome("features.exposure.ctaLearnMore")}
                  </Link>
                </CardContent>
              </Card>

              <Card className="group relative h-full overflow-hidden border-border/60 bg-card/80 shadow-sm">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20 ring-1 ring-emerald-500/30 dark:from-emerald-400/15 dark:to-sky-400/15 dark:ring-emerald-400/25">
                      <FolderOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <CardTitle className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      {tHome("features.management.title")}
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {tHome("features.management.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0">
                  <Link
                    href="/about/portfolio"
                    className="text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                  >
                    {tHome("features.management.ctaLearnMore")}
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="flex justify-center px-0 py-6">
          <a
            href="https://www.producthunt.com/products/create-spot?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-create-spot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <img
              alt="Create Spot - A home for creativity | Product Hunt"
              width={250}
              height={54}
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1083287&theme=neutral&t=1772444248450"
              className="h-auto w-[250px]"
            />
          </a>
        </section>
      </PageLayout>

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
              <strong className="text-foreground">
                {t("purpose.inspired")}
              </strong>{" "}
              {t("purpose.toCreateMore")}{" "}
              <strong className="text-foreground">
                {t("purpose.exhibit")}
              </strong>
              . {t("purpose.weBelieve")}{" "}
              <strong className="text-foreground">
                {t("purpose.sparked")}
              </strong>
              . {t("purpose.overTime")}{" "}
              <strong className="text-foreground">
                {t("purpose.building")}
              </strong>{" "}
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
    </>
  );
}
