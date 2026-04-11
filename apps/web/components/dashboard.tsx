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
    <div className="space-y-5 md:space-y-6">
      {firstName && (
        <h1 className="text-2xl font-bold text-foreground text-balance sm:text-3xl">
          Welcome back, {firstName}
        </h1>
      )}

      <OnboardingSection />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
