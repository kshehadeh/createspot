"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DashboardSection } from "@/components/dashboard-section";
import { Button } from "@/components/ui/button";
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

export function PortfolioSection({ portfolioUrl }: PortfolioSectionProps) {
  const t = useTranslations("dashboard.portfolio");
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
      className="text-sm font-medium text-primary hover:underline underline-offset-4"
    >
      {t("viewAll")}
    </Link>
  );

  return (
    <DashboardSection title={t("title")} action={action}>
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-md" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <>
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
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
        <div className="grid grid-cols-3 gap-3">
          {submissions.map((s) => {
            const displayImageUrl =
              s.imageUrl ||
              (s.isWorkInProgress ? s.latestProgressionImageUrl : null);
            return (
              <Link
                key={s.id}
                href={`${portfolioUrl}#${s.id}`}
                className={`group relative aspect-square overflow-hidden bg-muted ${
                  s.isWorkInProgress
                    ? "rounded-sm border-2 border-dashed border-muted-foreground/40"
                    : "rounded-md"
                }`}
              >
                {displayImageUrl ? (
                  <Image
                    src={displayImageUrl}
                    alt={s.title ?? ""}
                    fill
                    className={`object-cover transition-transform duration-200 group-hover:scale-105 ${
                      !s.imageUrl && s.isWorkInProgress ? "opacity-70" : ""
                    }`}
                    sizes="(max-width: 768px) 30vw, 15vw"
                    style={{
                      objectPosition: s.imageUrl
                        ? getObjectPositionStyle(s.imageFocalPoint)
                        : undefined,
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-2">
                    <p className="line-clamp-3 text-xs text-muted-foreground">
                      {s.title ?? ""}
                    </p>
                  </div>
                )}
                {s.isWorkInProgress && (
                  <span className="absolute top-1 right-1 rounded bg-amber-500/80 px-1.5 py-0.5 text-[10px] font-medium text-white z-10">
                    {t("wipBadge")}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </DashboardSection>
  );
}
