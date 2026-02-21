"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashboardSection } from "@/components/dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";

interface BadgeItem {
  key: string;
  name: string;
  description: string;
  image: string;
  awardedAt: string;
}

interface BadgesSectionProps {
  profileUrl: string;
}

export function BadgesSection({ profileUrl }: BadgesSectionProps) {
  const t = useTranslations("dashboard.badges");
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/badges")
      .then((r) => r.json())
      .then((data) => setBadges(data.badges ?? []))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false));
  }, []);

  const action = (
    <Link
      href={profileUrl}
      className="text-sm font-medium text-primary hover:underline underline-offset-4"
    >
      {t("viewProfile")}
    </Link>
  );

  return (
    <DashboardSection title={t("title")} action={action}>
      {loading ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-14 rounded-full" />
          ))}
        </div>
      ) : badges.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {badges.map((badge) => (
            <div
              key={badge.key}
              className="flex flex-col items-center gap-1 text-center"
              title={badge.description}
            >
              <div className="relative h-14 w-14 overflow-hidden rounded-full bg-muted ring-2 ring-border">
                <Image
                  src={badge.image}
                  alt={badge.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <p className="text-xs font-medium text-foreground leading-tight max-w-[64px]">
                {badge.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
