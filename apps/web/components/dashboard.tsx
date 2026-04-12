"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { OnboardingSection } from "@/components/dashboard/onboarding-section";
import { PortfolioSection } from "@/components/dashboard/portfolio-section";
import { CritiquesSection } from "@/components/dashboard/critiques-section";
import { RecentViewsSection } from "@/components/dashboard/recent-views-section";
import { FollowingSection } from "@/components/dashboard/following-section";
import { BadgesSection } from "@/components/dashboard/badges-section";
import { DashboardAnalyticsSection } from "@/components/dashboard/dashboard-analytics-section";
import { DashboardSection } from "@/components/dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";

function SectionSkeleton({ title }: { title: string }) {
  return (
    <DashboardSection title={title}>
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
  const firstName = userName?.split(" ")[0] ?? null;

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="rounded-2xl bg-surface-container-low p-5 shadow-[0_14px_35px_rgb(0_0_0_/_0.35)] sm:p-6">
        <p className="text-xs font-medium tracking-[0.12em] text-on-surface-variant uppercase">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground text-balance sm:text-4xl">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant sm:text-base">
          A focused overview of your portfolio momentum, critiques, and
          community activity.
        </p>
      </section>

      <OnboardingSection />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="min-w-0">
          <Suspense
            fallback={<SectionSkeleton title={tPortfolioSection("title")} />}
          >
            <PortfolioSection portfolioUrl={portfolioUrl} />
          </Suspense>
        </div>

        <Suspense fallback={<SectionSkeleton title="Recently Visited" />}>
          <RecentViewsSection />
        </Suspense>
      </div>

      <DashboardAnalyticsSection />

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
