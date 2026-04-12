"use client";

import { useEffect, useState } from "react";
import Link from "@/components/link";
import { useTranslations } from "next-intl";
import { DashboardSection } from "@/components/dashboard-section";
import { Skeleton } from "@/components/ui/skeleton";
import { getCreatorUrl } from "@/lib/utils";

interface CritiqueItem {
  id: string;
  createdAt: string;
  submission: {
    id: string;
    title: string | null;
    imageUrl: string | null;
    user: {
      id: string;
      name: string | null;
      slug: string | null;
    };
  };
}

interface CritiquesSectionProps {
  critiquesUrl: string;
}

export function CritiquesSection({ critiquesUrl }: CritiquesSectionProps) {
  const t = useTranslations("dashboard.critiques");
  const [critiques, setCritiques] = useState<CritiqueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/critiques")
      .then((r) => r.json())
      .then((data) => setCritiques(data.critiques ?? []))
      .catch(() => setCritiques([]))
      .finally(() => setLoading(false));
  }, []);

  const action = (
    <Link
      href={critiquesUrl}
      className="inline-flex items-center rounded-md px-1 py-0.5 text-sm font-medium text-primary hover:text-foreground hover:underline underline-offset-4"
    >
      {t("viewAll")}
    </Link>
  );

  return (
    <DashboardSection title={t("title")} action={action}>
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : critiques.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {critiques.map((c) => {
            const submissionUrl = `${getCreatorUrl(c.submission.user)}/s/${c.submission.id}`;
            return (
              <li key={c.id}>
                <Link
                  href={submissionUrl}
                  className="-mx-2 flex items-center gap-3 rounded-lg bg-surface-container-high px-3 py-2 transition-colors hover:bg-surface-container-highest"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {t("on")}{" "}
                      <span className="font-medium">
                        {c.submission.title ||
                          c.submission.user.name ||
                          "submission"}
                      </span>
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(c.createdAt).toLocaleDateString()}
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
