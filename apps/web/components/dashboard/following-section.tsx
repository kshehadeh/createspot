"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "@/components/link";
import { useTranslations } from "next-intl";
import { DashboardSection } from "@/components/dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { getCreatorUrl } from "@/lib/utils";

interface FollowItem {
  createdAt: string;
  following: {
    id: string;
    name: string | null;
    image: string | null;
    profileImageUrl: string | null;
    slug: string | null;
    submissions: {
      id: string;
      title: string | null;
      imageUrl: string | null;
    }[];
  };
}

export function FollowingSection() {
  const t = useTranslations("dashboard.following");
  const [follows, setFollows] = useState<FollowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/following")
      .then((r) => r.json())
      .then((data) => setFollows(data.follows ?? []))
      .catch(() => setFollows([]))
      .finally(() => setLoading(false));
  }, []);

  const action = (
    <Link
      href="/inspire/community"
      className="dashboard-editorial-link inline-flex items-center px-1 py-0.5 text-[10px] font-semibold tracking-[0.14em] uppercase"
    >
      {t("viewCommunity")}
    </Link>
  );

  return (
    <DashboardSection title={t("title")} action={action} editorial>
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1 rounded" />
            </div>
          ))}
        </div>
      ) : follows.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {follows.map((f) => {
            const user = f.following;
            const profileUrl = getCreatorUrl(user);
            const avatar = user.profileImageUrl ?? user.image;
            const latestWork = user.submissions[0];

            return (
              <li key={user.id}>
                <div className="-mx-2 flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.03] px-3 py-2">
                  <Link href={profileUrl} className="shrink-0">
                    <div className="relative h-9 w-9 overflow-hidden rounded-full bg-surface-lowest">
                      {avatar ? (
                        <Image
                          src={avatar}
                          alt={user.name ?? ""}
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-medium text-on-surface-variant">
                          {user.name?.charAt(0) ?? "?"}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={profileUrl}
                      className="text-sm font-medium text-foreground hover:underline underline-offset-4 truncate block"
                    >
                      {user.name ?? "Creator"}
                    </Link>
                    {latestWork && (
                      <Link
                        href={`${profileUrl}/s/${latestWork.id}`}
                        className="text-xs text-on-surface-variant transition-colors hover:text-foreground truncate block"
                      >
                        {t("latestWork")}: {latestWork.title ?? "untitled"}
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardSection>
  );
}
