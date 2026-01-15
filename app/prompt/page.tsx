import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getCurrentPrompt } from "@/lib/prompts";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { ThemedCard } from "@/components/themed-card";
import { StyledSignInButton } from "./styled-sign-in-button";
import {
  ImageIcon,
  HistoryIcon,
  SparklesIcon,
  ArrowRightIcon,
} from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("prompt");
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

export default async function PromptsPage() {
  const t = await getTranslations("prompt");
  const session = await auth();
  const currentPrompt = await getCurrentPrompt();

  return (
    <PageLayout maxWidth="max-w-5xl">
      {/* Hero Section with Prominent Words */}
      <section className="mb-12 text-center">
        <p className="mb-6 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {t("thisWeekCreativeChallenge")}
        </p>

        {currentPrompt ? (
          <>
            {/* Large Prominent Words */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-10">
              {[
                currentPrompt.word1,
                currentPrompt.word2,
                currentPrompt.word3,
              ].map((word, index) => (
                <span
                  key={index}
                  className={`inline-block text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl rainbow-shimmer-${index + 1}`}
                >
                  {word}
                </span>
              ))}
            </div>

            <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
              {t("pickWordDescription")}
            </p>
          </>
        ) : (
          <div className="mb-10">
            <p className="text-xl text-muted-foreground">
              {t("noActivePrompt")}
            </p>
          </div>
        )}
      </section>

      {/* Main Action Cards */}
      <section className="mb-16">
        {session ? (
          /* Logged In State - Show all options */
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Start Creating Card */}
            <ThemedCard
              variant="violet"
              className="group relative overflow-hidden rounded-2xl border-2 transition-all hover:shadow-lg"
            >
              <Link href="/prompt/play" className="block">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-200 text-violet-700 dark:bg-violet-800 dark:text-violet-300">
                    <SparklesIcon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-foreground">
                    {t("startCreating")}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t("startCreatingDescription")}
                  </p>
                  <div className="flex items-center text-sm font-medium text-violet-600 dark:text-violet-400">
                    {t("createNow")}
                    <ArrowRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Link>
            </ThemedCard>

            {/* This Week's Gallery Card */}
            <Card className="group relative overflow-hidden rounded-2xl border bg-card transition-all hover:border-amber-300 hover:shadow-lg dark:border-border dark:bg-card dark:hover:border-amber-700">
              <Link href="/prompt/this-week" className="block">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-foreground">
                    {t("thisWeekGallery")}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t("thisWeekGalleryDescription")}
                  </p>
                  <div className="flex items-center text-sm font-medium text-amber-600 dark:text-amber-400">
                    {t("browseGallery")}
                    <ArrowRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Link>
            </Card>

            {/* Your History Card */}
            <Card className="group relative overflow-hidden rounded-2xl border bg-card transition-all hover:border-rose-300 hover:shadow-lg dark:border-border dark:bg-card dark:hover:border-rose-700">
              <Link href="/prompt/history" className="block">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400">
                    <HistoryIcon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-foreground">
                    {t("yourHistory")}
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t("yourHistoryDescription")}
                  </p>
                  <div className="flex items-center text-sm font-medium text-rose-600 dark:text-rose-400">
                    {t("viewHistory")}
                    <ArrowRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>
        ) : (
          /* Not Logged In State - Show sign in prompt with gallery option */
          <div className="grid gap-6 md:grid-cols-2">
            {/* Sign In Card */}
            <ThemedCard
              variant="violet"
              className="relative overflow-hidden rounded-2xl border-2"
            >
              <CardContent className="p-8">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-violet-200 text-violet-700 dark:bg-violet-800 dark:text-violet-300">
                  <SparklesIcon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-foreground">
                  {t("readyToCreate")}
                </h3>
                <p className="mb-6 text-muted-foreground">
                  {t("readyToCreateDescription")}
                </p>
                <StyledSignInButton />
              </CardContent>
            </ThemedCard>

            {/* Browse Gallery Card */}
            <Card className="group relative overflow-hidden rounded-2xl border bg-card transition-all hover:border-amber-300 hover:shadow-lg dark:border-border dark:bg-card dark:hover:border-amber-700">
              <Link href="/prompt/this-week" className="block h-full">
                <CardContent className="flex h-full flex-col p-8">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-foreground">
                    {t("justBrowsing")}
                  </h3>
                  <p className="mb-6 flex-grow text-muted-foreground">
                    {t("justBrowsingDescription")}
                  </p>
                  <div className="flex items-center text-sm font-medium text-amber-600 dark:text-amber-400">
                    {t("browseThisWeekGallery")}
                    <ArrowRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>
        )}
      </section>

      {/* How It Works Section - Simplified */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
          {t("howItWorks")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="rounded-xl bg-card dark:bg-card">
            <CardContent className="p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl font-bold dark:bg-amber-900/30">
                1
              </div>
              <h3 className="mb-2 font-semibold text-foreground">
                {t("chooseWord")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("chooseWordDescription")}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-card dark:bg-card">
            <CardContent className="p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-2xl font-bold dark:bg-rose-900/30">
                2
              </div>
              <h3 className="mb-2 font-semibold text-foreground">
                {t("createSomething")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("createSomethingDescription")}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-card dark:bg-card">
            <CardContent className="p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-2xl font-bold dark:bg-violet-900/30">
                3
              </div>
              <h3 className="mb-2 font-semibold text-foreground">
                {t("shareDiscover")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("shareDiscoverDescription")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tips Section */}
      <section>
        <div className="rounded-2xl bg-gradient-to-br from-muted to-muted/50 p-8">
          <h2 className="mb-6 text-xl font-bold text-foreground">
            {t("tipsForGettingStarted")}
          </h2>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="shrink-0 text-violet-600 dark:text-violet-400">
                ✦
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">
                  {t("thinkAbstractly")}
                </strong>{" "}
                {t("thinkAbstractlyDescription")}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-violet-600 dark:text-violet-400">
                ✦
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">{t("combineWords")}</strong>{" "}
                {t("combineWordsDescription")}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-violet-600 dark:text-violet-400">
                ✦
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">
                  {t("useWhatYouHave")}
                </strong>{" "}
                {t("useWhatYouHaveDescription")}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-violet-600 dark:text-violet-400">
                ✦
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">
                  {t("addExistingWork")}
                </strong>{" "}
                {t("addExistingWorkDescription")}
              </span>
            </li>
          </ul>
        </div>
      </section>
    </PageLayout>
  );
}
