"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashboardSection } from "@/components/dashboard-section";
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
  const [views, setViews] = useState<RecentViewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/recent-views")
      .then((r) => r.json())
      .then((data) => setViews(data.views ?? []))
      .catch(() => setViews([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardSection title={t("title")}>
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 shrink-0 rounded-md" />
              <Skeleton className="h-4 flex-1 rounded" />
            </div>
          ))}
        </div>
      ) : views.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {views.map((v) => {
            const submissionUrl = `${getCreatorUrl(v.submission.user)}/s/${v.submission.id}`;
            return (
              <li key={v.submission.id}>
                <Link
                  href={submissionUrl}
                  className="flex items-center gap-3 rounded-md p-2 -mx-2 transition-colors hover:bg-muted/60"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    {v.submission.imageUrl ? (
                      <Image
                        src={v.submission.imageUrl}
                        alt={v.submission.title ?? ""}
                        fill
                        className="object-cover"
                        sizes="48px"
                        style={{
                          objectPosition: getObjectPositionStyle(
                            v.submission.imageFocalPoint,
                          ),
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {v.submission.title ||
                        v.submission.user.name ||
                        "Submission"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {v.submission.user.name}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardSection>
  );
}
