"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "@/components/link";
import { useLocale, useTranslations } from "next-intl";
import { DashboardSection } from "@/components/dashboard-section";
import {
  dashboardMiniThumbGridClass,
  dashboardMiniThumbImageSizes,
  dashboardMiniThumbScrollClass,
} from "@/components/dashboard/dashboard-mini-thumb-layout";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCreatorUrl } from "@/lib/utils";
import { getObjectPositionStyle } from "@/lib/image-utils";

interface RecentViewItem {
  viewedAt: string;
  submission: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    imageFocalPoint: { x: number; y: number } | null;
    user: {
      id: string;
      name: string | null;
      slug: string | null;
    };
  };
}

export function RecentViewsSection() {
  const t = useTranslations("dashboard.recentViews");
  const locale = useLocale();
  const [views, setViews] = useState<RecentViewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/recent-views")
      .then((r) => r.json())
      .then((data) => setViews(data.views ?? []))
      .catch(() => setViews([]))
      .finally(() => setLoading(false));
  }, []);

  const formatVisitedAt = (iso: string) => {
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
    <DashboardSection title={t("title")}>
      {loading ? (
        <div className={dashboardMiniThumbScrollClass}>
          <div className={dashboardMiniThumbGridClass}>
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-md" />
            ))}
          </div>
        </div>
      ) : views.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className={dashboardMiniThumbScrollClass}>
          <div className={dashboardMiniThumbGridClass}>
            {views.map((v) => {
              const submissionUrl = `${getCreatorUrl(v.submission.user)}/s/${v.submission.id}`;
              const displayTitle =
                v.submission.title ||
                v.submission.user.name ||
                t("untitledFallback");
              const creatorDisplay =
                v.submission.user.name ||
                v.submission.user.slug ||
                t("unknownCreator");
              const visitedLabel = formatVisitedAt(v.viewedAt);

              return (
                <HoverCard
                  key={v.submission.id}
                  openDelay={200}
                  closeDelay={100}
                >
                  <HoverCardTrigger asChild>
                    <Link
                      href={submissionUrl}
                      className="group relative aspect-square overflow-hidden rounded-md bg-muted outline-none"
                    >
                      {v.submission.imageUrl ? (
                        <Image
                          src={v.submission.imageUrl}
                          alt={displayTitle}
                          fill
                          className="object-cover transition-transform duration-200 group-hover:scale-105"
                          sizes={dashboardMiniThumbImageSizes}
                          style={{
                            objectPosition: getObjectPositionStyle(
                              v.submission.imageFocalPoint,
                            ),
                          }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-2">
                          <p className="line-clamp-3 text-center text-xs text-muted-foreground">
                            {displayTitle}
                          </p>
                        </div>
                      )}
                    </Link>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72" side="top" align="center">
                    <p className="font-medium text-foreground">
                      {displayTitle}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("hover.by", { name: creatorDisplay })}
                    </p>
                    {visitedLabel ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("hover.lastVisited", { datetime: visitedLabel })}
                      </p>
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
