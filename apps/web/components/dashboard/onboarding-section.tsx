"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  X,
  Heart,
  Sparkles,
  MessageCircle,
  UserPlus,
  FolderHeart,
} from "lucide-react";

interface OnboardingStatus {
  hasFavorited: boolean;
  hasSubmission: boolean;
  hasCritique: boolean;
  hasFollowing: boolean;
  hasCollection: boolean;
  dismissed: boolean;
}

interface OnboardingSectionProps {
  managePortfolioUrl: string;
}

export function OnboardingSection({
  managePortfolioUrl,
}: OnboardingSectionProps) {
  const t = useTranslations("dashboard.onboarding");
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/onboarding")
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  // Don't render anything until we know if the section should be visible
  // This prevents a flash of the skeleton/title before hiding
  if (loading) {
    return null;
  }

  if (!status || status.dismissed) {
    return null;
  }

  const items = [
    {
      key: "favorite" as const,
      completed: status.hasFavorited,
      href: "/inspire/exhibition/gallery/grid",
      icon: Heart,
      color: "text-rose-600 dark:text-rose-300",
      bgColor:
        "bg-gradient-to-br from-rose-200 to-rose-400 dark:bg-none dark:bg-rose-800/50",
      hoverRing: "hover:ring-rose-400",
    },
    {
      key: "submission" as const,
      completed: status.hasSubmission,
      href: "/inspire/prompt/play",
      icon: Sparkles,
      color: "text-amber-600 dark:text-amber-300",
      bgColor:
        "bg-gradient-to-br from-amber-200 to-amber-400 dark:bg-none dark:bg-amber-800/50",
      hoverRing: "hover:ring-amber-400",
    },
    {
      key: "critique" as const,
      completed: status.hasCritique,
      href: "/inspire/exhibition/gallery/grid",
      icon: MessageCircle,
      color: "text-sky-600 dark:text-sky-300",
      bgColor:
        "bg-gradient-to-br from-sky-200 to-sky-400 dark:bg-none dark:bg-sky-800/50",
      hoverRing: "hover:ring-sky-400",
    },
    {
      key: "follow" as const,
      completed: status.hasFollowing,
      href: "/creators",
      icon: UserPlus,
      color: "text-emerald-600 dark:text-emerald-300",
      bgColor:
        "bg-gradient-to-br from-emerald-200 to-emerald-400 dark:bg-none dark:bg-emerald-800/50",
      hoverRing: "hover:ring-emerald-400",
    },
    {
      key: "collection" as const,
      completed: status.hasCollection,
      href: "/inspire/favorites",
      icon: FolderHeart,
      color: "text-violet-600 dark:text-violet-300",
      bgColor:
        "bg-gradient-to-br from-violet-200 to-violet-400 dark:bg-none dark:bg-violet-800/50",
      hoverRing: "hover:ring-violet-400",
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const allComplete = completedCount === items.length;

  // Hide if all tasks are complete
  if (allComplete) {
    return null;
  }

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      const response = await fetch("/api/dashboard/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss" }),
      });

      if (response.ok) {
        setStatus((prev) => (prev ? { ...prev, dismissed: true } : null));
      }
    } catch {
      // Silently fail
    } finally {
      setDismissing(false);
    }
  };

  return (
    <div className="not-first-child rounded-xl border border-primary/30 bg-white p-5 dark:bg-background">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">
            {t("title")}
          </h2>
        </div>
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key}>
              {item.completed ? (
                <div className="flex items-center gap-3 rounded-lg p-3 bg-muted">
                  <CheckCircle2 className={`h-5 w-5 shrink-0 ${item.color}`} />
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground line-through">
                      {t(`items.${item.key}.label`)}
                    </span>
                    <span className="text-sm text-muted-foreground/80">
                      {t(`items.${item.key}.cta`)}
                    </span>
                  </div>
                </div>
              ) : (
                <Link
                  href={
                    item.key === "submission" ? managePortfolioUrl : item.href
                  }
                  className={`flex items-center gap-3 rounded-lg p-3 ${item.bgColor} ${item.hoverRing} hover:ring-2 transition-all`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${item.color}`} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {t(`items.${item.key}.label`)}
                    </span>
                    <span className="text-sm text-foreground/80">
                      {t(`items.${item.key}.cta`)}
                    </span>
                  </div>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
