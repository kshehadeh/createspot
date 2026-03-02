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

export function OnboardingSection() {
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
    },
    {
      key: "submission" as const,
      completed: status.hasSubmission,
      href: "/inspire/prompt/play",
      icon: Sparkles,
    },
    {
      key: "critique" as const,
      completed: status.hasCritique,
      href: "/inspire/exhibition/gallery/grid",
      icon: MessageCircle,
    },
    {
      key: "follow" as const,
      completed: status.hasFollowing,
      href: "/creators",
      icon: UserPlus,
    },
    {
      key: "collection" as const,
      completed: status.hasCollection,
      href: "/inspire/favorites",
      icon: FolderHeart,
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
    <div className="not-first-child overflow-hidden rounded-xl border bg-card text-foreground shadow-sm">
      <div className="flex justify-end p-4">
        <button
          onClick={handleDismiss}
          disabled={dismissing}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-6 px-5 pb-6 sm:px-6 lg:flex-row">
        <div className="relative overflow-hidden rounded-lg bg-muted/60 p-5 sm:p-6 lg:w-2/5">
          <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-primary/5" />
          <div className="pointer-events-none absolute -bottom-10 right-0 h-28 w-28 rounded-full bg-primary/10" />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              {t("title")}
            </div>
            <h2 className="text-xl font-semibold leading-snug">
              {t("welcomeTitle")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("welcomeBody")}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("stepsTitle")}
          </h3>
          <ul className="space-y-3">
            {items.map((item, index) => {
              const Icon = item.icon;
              const completed = item.completed;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="group flex items-start gap-3 rounded-lg border border-border/60 bg-muted/40 p-3 transition hover:border-primary/40 hover:bg-muted"
                  >
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border group-hover:ring-primary/40">
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className={completed ? "line-through text-muted-foreground" : undefined}>
                          {t(`items.${item.key}.label`)}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {t(`items.${item.key}.cta`)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
