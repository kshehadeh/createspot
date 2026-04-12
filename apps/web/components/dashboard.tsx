"use client";

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { OnboardingSection } from "@/components/dashboard/onboarding-section";
import { PortfolioSection } from "@/components/dashboard/portfolio-section";
import { CritiquesSection } from "@/components/dashboard/critiques-section";
import { RecentViewsSection } from "@/components/dashboard/recent-views-section";
import { FollowingSection } from "@/components/dashboard/following-section";
import { BadgesSection } from "@/components/dashboard/badges-section";
import {
  DashboardCategoryPortfolio,
  DashboardSubmissionsActivity,
  DashboardTagArchive,
  parseDashboardAnalyticsResponse,
  type DashboardAnalyticsPayload,
} from "@/components/dashboard/dashboard-analytics-section";
import { DashboardSection } from "@/components/dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";

function SectionSkeleton({ title }: { title: string }) {
  return (
    <DashboardSection title={title} editorial>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-full rounded-md" />
        <Skeleton className="h-8 w-3/4 rounded-md" />
      </div>
    </DashboardSection>
  );
}

interface DashboardProps {
  portfolioUrl: string;
  critiquesUrl: string;
  profileUrl: string;
  userName: string | null;
}

export function Dashboard({
  portfolioUrl,
  critiquesUrl,
  profileUrl,
  userName,
}: DashboardProps) {
  const tPortfolioSection = useTranslations("dashboard.portfolio");
  const tWelcome = useTranslations("dashboard.welcome");
  const firstName = userName?.split(" ")[0] ?? null;

  const [analytics, setAnalytics] = useState<DashboardAnalyticsPayload | null>(
    null,
  );
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/analytics")
      .then((r) => r.json())
      .then((json: unknown) =>
        setAnalytics(parseDashboardAnalyticsResponse(json)),
      )
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, []);

  const momentumLine = (() => {
    if (analyticsLoading) {
      return <Skeleton className="mt-3 h-4 max-w-md rounded-md bg-white/10" />;
    }
    if (!analytics) {
      return (
        <p className="dashboard-editorial-muted mt-3 max-w-2xl text-sm leading-relaxed">
          {tWelcome("subtitle")}
        </p>
      );
    }
    const prev = analytics.previousWindowSubmissionCount ?? 0;
    const cur = analytics.currentWindowSubmissionCount ?? 0;
    const mom = analytics.momentumPercent;

    if (prev === 0 && cur > 0) {
      return (
        <p className="dashboard-editorial-muted mt-3 max-w-2xl text-sm leading-relaxed">
          {tWelcome("momentumNew")}
        </p>
      );
    }
    if (prev > 0 && mom != null) {
      if (mom > 0) {
        return (
          <p className="dashboard-editorial-muted mt-3 max-w-2xl text-sm leading-relaxed">
            {tWelcome("momentumUp", { percent: mom })}
          </p>
        );
      }
      if (mom < 0) {
        return (
          <p className="dashboard-editorial-muted mt-3 max-w-2xl text-sm leading-relaxed">
            {tWelcome("momentumDown", { percent: Math.abs(mom) })}
          </p>
        );
      }
      return (
        <p className="dashboard-editorial-muted mt-3 max-w-2xl text-sm leading-relaxed">
          {tWelcome("momentumSame")}
        </p>
      );
    }
    return (
      <p className="dashboard-editorial-muted mt-3 max-w-2xl text-sm leading-relaxed">
        {tWelcome("subtitle")}
      </p>
    );
  })();

  return (
    <div className="dashboard-editorial space-y-8 md:space-y-10">
      <header className="dashboard-editorial-hero rounded-2xl border border-white/[0.06] bg-[#141414] px-5 py-6 sm:px-7 sm:py-8">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-[hsl(38_42%_58%)] uppercase">
          {tWelcome("eyebrow")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
          {firstName
            ? tWelcome("greeting", { name: firstName })
            : tWelcome("greetingAnonymous")}
        </h1>
        {momentumLine}
      </header>

      <OnboardingSection />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-8">
          <Suspense
            fallback={<SectionSkeleton title={tPortfolioSection("title")} />}
          >
            <PortfolioSection portfolioUrl={portfolioUrl} />
          </Suspense>
          <DashboardSubmissionsActivity
            data={analytics}
            loading={analyticsLoading}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6 lg:col-span-4">
          <DashboardCategoryPortfolio
            data={analytics}
            loading={analyticsLoading}
          />
          <Suspense fallback={<SectionSkeleton title="Recently Visited" />}>
            <RecentViewsSection variant="dense" />
          </Suspense>
          <DashboardTagArchive data={analytics} loading={analyticsLoading} />
        </div>
      </div>

      <Suspense fallback={<SectionSkeleton title="Recent Critiques" />}>
        <CritiquesSection critiquesUrl={critiquesUrl} />
      </Suspense>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Suspense fallback={<SectionSkeleton title="People You Follow" />}>
          <FollowingSection />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Badges" />}>
          <BadgesSection profileUrl={profileUrl} />
        </Suspense>
      </div>
    </div>
  );
}
