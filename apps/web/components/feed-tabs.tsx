"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

type FeedTab = "home" | "following" | "favorites";

const MIN_PENDING_MS = 250;

export interface FeedTabsProps {
  active: FeedTab;
  isLoggedIn: boolean;
}

export function FeedTabs({ active, isLoggedIn }: FeedTabsProps) {
  const t = useTranslations("feed");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isIndicatorVisible, setIsIndicatorVisible] = useState(false);

  const pendingStartRef = useRef<number | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tabs = useMemo(() => {
    const base: Array<{ tab: FeedTab; href: string; label: string }> = [
      { tab: "home", href: "/", label: t("home") },
    ];
    if (isLoggedIn) {
      base.push(
        { tab: "following", href: "/?tab=following", label: t("following") },
        {
          tab: "favorites",
          href: "/?tab=favorites",
          label: t("favoritesTab"),
        },
      );
    }
    return base;
  }, [isLoggedIn, t]);

  useEffect(() => {
    if (isPending) {
      if (pendingStartRef.current == null) {
        pendingStartRef.current = performance.now();
      }
      setIsIndicatorVisible(true);
      return;
    }

    if (!isIndicatorVisible) {
      pendingStartRef.current = null;
      return;
    }

    const start = pendingStartRef.current ?? performance.now();
    const elapsed = performance.now() - start;
    const remaining = Math.max(0, MIN_PENDING_MS - elapsed);

    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
    }

    clearTimerRef.current = setTimeout(() => {
      setIsIndicatorVisible(false);
      pendingStartRef.current = null;
    }, remaining);

    return () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    };
  }, [isPending, isIndicatorVisible]);

  useEffect(() => {
    // When the active tab changes, ensure the indicator is shown (min duration handled above).
    // This covers both click navigation and other route changes (e.g. back/forward).
    if (pendingStartRef.current == null) {
      pendingStartRef.current = performance.now();
    }
    setIsIndicatorVisible(true);
  }, [active]);

  const linkClass = (isActive: boolean) => {
    return [
      "pb-3 text-sm font-medium transition-colors",
      isActive
        ? "text-foreground border-b-2 border-foreground"
        : "text-muted-foreground hover:text-foreground",
    ].join(" ");
  };

  return (
    <nav
      aria-label={t("title")}
      className="flex items-center justify-between border-b border-border"
    >
      <div
        className="flex gap-6"
        role="tablist"
        aria-label={t("title")}
        aria-busy={isPending || isIndicatorVisible}
      >
        {tabs.map(({ tab, href, label }) => {
          const isActive = tab === active;

          return (
            <Link
              key={tab}
              href={href}
              role="tab"
              aria-selected={isActive}
              aria-current={isActive ? "page" : undefined}
              className={linkClass(isActive)}
              onClick={(e) => {
                if (isActive) return;
                if (
                  e.metaKey ||
                  e.ctrlKey ||
                  e.shiftKey ||
                  e.altKey ||
                  // Middle-click opens new tab/window on most platforms.
                  e.button === 1
                ) {
                  return;
                }
                e.preventDefault();
                if (clearTimerRef.current) {
                  clearTimeout(clearTimerRef.current);
                  clearTimerRef.current = null;
                }
                pendingStartRef.current = null;
                setIsIndicatorVisible(true);
                startTransition(() => {
                  router.push(href);
                });
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
      <div
        aria-hidden
        className="pb-3"
        // Reserve space so the loader never shifts layout.
        style={{ width: 18 }}
      >
        {isPending || isIndicatorVisible ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>
    </nav>
  );
}

