"use client";

import { Suspense } from "react";
import { OnboardingSection } from "@/components/dashboard/onboarding-section";
import { PortfolioSection } from "@/components/dashboard/portfolio-section";
import { CritiquesSection } from "@/components/dashboard/critiques-section";
import { RecentViewsSection } from "@/components/dashboard/recent-views-section";
import { FollowingSection } from "@/components/dashboard/following-section";
import { BadgesSection } from "@/components/dashboard/badges-section";
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
  const firstName = userName?.split(" ")[0] ?? null;

  return (
    <div className="space-y-4">
      {firstName && (
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Welcome back, {firstName}
        </h1>
      )}

      <OnboardingSection />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<SectionSkeleton title="My Portfolio" />}>
          <PortfolioSection portfolioUrl={portfolioUrl} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Recent Critiques" />}>
          <CritiquesSection critiquesUrl={critiquesUrl} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Recently Visited" />}>
          <RecentViewsSection />
        </Suspense>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
