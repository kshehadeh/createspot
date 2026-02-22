"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DashboardSection } from "@/components/dashboard-section";
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
          {submissions.map((s) => (
            <Link
              key={s.id}
              href={`${portfolioUrl}#${s.id}`}
              className="group relative aspect-square overflow-hidden rounded-md bg-muted"
            >
              {s.imageUrl ? (
                <Image
                  src={s.imageUrl}
                  alt={s.title ?? ""}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                  sizes="(max-width: 768px) 30vw, 15vw"
                  style={{
                    objectPosition: getObjectPositionStyle(s.imageFocalPoint),
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center p-2">
                  <p className="line-clamp-3 text-xs text-muted-foreground">
                    {s.title ?? ""}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </DashboardSection>
  );
}
