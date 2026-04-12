"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "@/components/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/dashboard-section";
import {
  dashboardMiniThumbGridClass,
  dashboardMiniThumbImageSizes,
  dashboardMiniThumbScrollClass,
} from "@/components/dashboard/dashboard-mini-thumb-layout";
import { Button } from "@createspot/ui-primitives/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getObjectPositionStyle } from "@/lib/image-utils";

const SubmissionEditModal = dynamic(
  () =>
    import("@/components/submission-edit-modal").then((mod) => ({
      default: mod.SubmissionEditModal,
    })),
  { ssr: false },
);

interface PortfolioSubmission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint: { x: number; y: number } | null;
  text: string | null;
  shareStatus: string;
  isWorkInProgress?: boolean;
  latestProgressionImageUrl?: string | null;
  latestProgressionText?: string | null;
  createdAt: string;
}

interface PortfolioSectionProps {
  portfolioUrl: string;
}

function shareStatusLabel(
  status: string,
  tPortfolio: (key: string) => string,
): string {
  if (status === "PRIVATE") {
    return tPortfolio("shareStatus.private");
  }
  if (status === "PROFILE") {
    return tPortfolio("shareStatus.profile");
  }
  if (status === "PUBLIC") {
    return tPortfolio("shareStatus.public");
  }
  return status;
}

export function PortfolioSection({ portfolioUrl }: PortfolioSectionProps) {
  const t = useTranslations("dashboard.portfolio");
  const tPortfolio = useTranslations("portfolio");
  const locale = useLocale();
  const [submissions, setSubmissions] = useState<PortfolioSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/portfolio")
      .then((r) => r.json())
      .then((data) => setSubmissions(data.submissions ?? []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, []);

  const action = (
    <Link
      href={portfolioUrl}
      className="inline-flex items-center rounded-md px-1 py-0.5 text-sm font-medium text-primary hover:text-foreground hover:underline underline-offset-4"
    >
      {t("viewAll")}
    </Link>
  );

  const formatAddedAt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return "";
    }
    return d.toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <DashboardSection title={t("title")} action={action}>
      {loading ? (
        <div className={dashboardMiniThumbScrollClass}>
          <div className={dashboardMiniThumbGridClass}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-md" />
            ))}
          </div>
        </div>
      ) : submissions.length === 0 ? (
        <>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-sm text-on-surface-variant">{t("empty")}</p>
            <Button
              variant="gradient"
              onClick={() => setIsCreateModalOpen(true)}
            >
              {t("addSubmission")}
            </Button>
          </div>
          <SubmissionEditModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            mode="create"
          />
        </>
      ) : (
        <div className={dashboardMiniThumbScrollClass}>
          <div className={dashboardMiniThumbGridClass}>
            {submissions.map((s) => {
              const displayImageUrl =
                s.imageUrl ||
                (s.isWorkInProgress ? s.latestProgressionImageUrl : null);
              const creatorBase = portfolioUrl.replace(/\/portfolio\/?$/, "");
              const submissionViewUrl = `${creatorBase}/s/${s.id}`;
              const displayTitle = s.title || tPortfolio("untitled");
              const visibility = shareStatusLabel(s.shareStatus, tPortfolio);
              const addedLabel = formatAddedAt(s.createdAt);

              return (
                <HoverCard key={s.id} openDelay={200} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <Link
                      href={submissionViewUrl}
                      className={`group relative aspect-square overflow-hidden bg-surface-lowest outline-none ${
                        s.isWorkInProgress
                          ? "rounded-lg border border-dashed border-outline-variant/40"
                          : "rounded-xl"
                      }`}
                    >
                      {displayImageUrl ? (
                        <Image
                          src={displayImageUrl}
                          alt={displayTitle}
                          fill
                          className={`object-cover transition-transform duration-200 group-hover:scale-105 ${
                            !s.imageUrl && s.isWorkInProgress
                              ? "opacity-70"
                              : ""
                          }`}
                          sizes={dashboardMiniThumbImageSizes}
                          style={{
                            objectPosition: s.imageUrl
                              ? getObjectPositionStyle(s.imageFocalPoint)
                              : undefined,
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-2">
                          <p className="line-clamp-3 text-xs text-on-surface-variant">
                            {displayTitle}
                          </p>
                        </div>
                      )}
                      {s.isWorkInProgress && (
                        <span className="absolute top-1 right-1 z-10 rounded bg-amber-500/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {t("wipBadge")}
                        </span>
                      )}
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72" side="top" align="center">
                    <p className="font-medium text-foreground">
                      {displayTitle}
                    </p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      <span className="font-medium text-foreground/80">
                        {t("hover.visibility")}
                      </span>{" "}
                      {visibility}
                    </p>
                    {addedLabel ? (
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {t("hover.added", { datetime: addedLabel })}
                      </p>
                    ) : null}
                    {s.isWorkInProgress ? (
                      <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-500">
                        {t("hover.workInProgress")}
                      </p>
                    ) : null}
                    {s.text?.trim() ? (
                      <div className="mt-2 border-t border-outline-variant/30 pt-2">
                        <p className="text-xs font-medium text-on-surface-variant">
                          {t("hover.description")}
                        </p>
                        <p className="mt-1 line-clamp-4 text-sm text-foreground">
                          {s.text.trim()}
                        </p>
                      </div>
                    ) : null}
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>
        </div>
      )}
    </DashboardSection>
  );
}
