import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";
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
import { getObjectPositionStyle } from "@/lib/image-utils";
import { getCreatorUrl } from "@/lib/utils";
import packageJson from "@/package.json";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

// Get featured artists - users with portfolio items or featured submissions
// Get recent public work
async function getRecentWork() {
  return prisma.submission.findMany({
    where: {
      shareStatus: "PUBLIC",
      OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

type HomepageHeroData =
  | {
      type: "carousel";
      submissions: Awaited<ReturnType<typeof getRecentWork>>;
    }
  | {
      type: "hero";
      submission: Awaited<ReturnType<typeof getRecentWork>>[number];
    }
  | {
      type: "none";
    };

async function getHomepageHeroData(): Promise<HomepageHeroData> {
  const settings = await getSiteSettings();

  if (settings.homepageCarouselExhibitId) {
    const rows = await prisma.exhibitSubmission.findMany({
      where: {
        exhibitId: settings.homepageCarouselExhibitId,
        submission: {
          shareStatus: "PUBLIC",
          OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
        },
      },
      orderBy: { order: "asc" },
      take: 8,
      include: {
        submission: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    const submissions = rows.map((r) => r.submission);
    if (submissions.length > 0) {
      return { type: "carousel", submissions };
    }
  }

  if (settings.homepageCarouselFallback === "hero") {
    if (!settings.homepageHeroSubmissionId) {
      return { type: "none" };
    }

    const submission = await prisma.submission.findFirst({
      where: {
        id: settings.homepageHeroSubmissionId,
        shareStatus: "PUBLIC",
        imageUrl: { not: null },
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    if (!submission) {
      return { type: "none" };
    }

    return { type: "hero", submission };
  }

  const submissions = await getRecentWork();
  return { type: "carousel", submissions };
}

export default async function Home() {
  const [session, t, tFooter, heroData] = await Promise.all([
    auth(),
    getTranslations("home"),
    getTranslations("footer"),
    getHomepageHeroData(),
  ]);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative min-h-[360px] overflow-hidden sm:min-h-[440px] lg:min-h-[540px]">
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
              {t("heroTitle")}{" "}
              <span className="block bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400 bg-clip-text text-transparent font-permanent-marker">
                {t("heroTitleHighlight")}
              </span>
            </h1>
            <p className="max-w-2xl text-lg text-white/80 sm:text-xl">
              {t("heroDescription")}
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="relative z-10 -mt-16 px-6">
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
                      {t("highlights.portfolios.title")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {t("highlights.portfolios.description")}
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
                      {t("highlights.portfolios.ctaView")}
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
                      {t("highlights.portfolios.ctaSignIn")}
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
                      {t("highlights.community.title")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {t("highlights.community.description")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/inspire/community">
                    {t("highlights.community.cta")}
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
                      {t("highlights.museums.title")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {t("highlights.museums.description")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/inspire/museums">
                    {t("highlights.museums.cta")}
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
                      {t("highlights.exhibits.title")}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                      {t("highlights.exhibits.description")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-0">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/inspire/exhibition">
                    {t("highlights.exhibits.cta")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="px-6 pb-12 pt-10 sm:pb-16">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-3xl font-medium leading-relaxed text-foreground/80 sm:text-4xl sm:leading-relaxed md:text-5xl md:leading-relaxed lg:text-6xl lg:leading-relaxed">
            {t("missionStatement")}{" "}
            <strong className="rainbow-sheen">{t("missionExhibit")}</strong>,
            find inspiration to{" "}
            <strong className="rainbow-sheen">{t("missionCreate")}</strong>, and{" "}
            <strong className="rainbow-sheen">{t("missionSupport")}</strong>.
          </p>
        </div>
      </section>

      {/* Feature Quadrants */}
      <section className="border-t border-border/50 bg-muted/30 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="group relative h-full overflow-hidden border-border/60 bg-card/80 shadow-sm">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 ring-1 ring-amber-500/30 dark:from-amber-400/15 dark:to-rose-400/15 dark:ring-amber-400/25">
                    <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <CardTitle className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    {t("features.inspiration.title")}
                  </CardTitle>
                </div>
                <CardDescription className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {t("features.inspiration.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/inspire/exhibition"
                    className="text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                  >
                    {t("features.inspiration.ctaExhibits")}
                  </Link>
                  <Link
                    href="/about/prompt-submissions"
                    className="text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                  >
                    {t("features.inspiration.ctaAboutPrompts")}
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
                    {t("features.critique.title")}
                  </CardTitle>
                </div>
                <CardDescription className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {t("features.critique.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <Link
                  href="/about/critiques"
                  className="text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                >
                  {t("features.critique.ctaLearnMore")}
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
                    {t("features.exposure.title")}
                  </CardTitle>
                </div>
                <CardDescription className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {t("features.exposure.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <Link
                  href="/about/features"
                  className="text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                >
                  {t("features.exposure.ctaLearnMore")}
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
                    {t("features.management.title")}
                  </CardTitle>
                </div>
                <CardDescription className="mt-4 text-base leading-relaxed text-muted-foreground">
                  {t("features.management.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0">
                <Link
                  href="/about/portfolio"
                  className="text-sm font-medium text-foreground underline underline-offset-4 decoration-foreground/30 transition-colors hover:decoration-foreground"
                >
                  {t("features.management.ctaLearnMore")}
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
          <span>
            {tFooter("copyright", { year: new Date().getFullYear() })}
          </span>
          <span className="hidden sm:inline">|</span>
          <Link
            href="/about/terms"
            className="transition-colors hover:text-foreground underline underline-offset-4"
          >
            {tFooter("terms")}
          </Link>
          <span className="hidden sm:inline">|</span>
          <span>{tFooter("version", { version: packageJson.version })}</span>
        </div>
      </footer>
    </main>
  );
}
