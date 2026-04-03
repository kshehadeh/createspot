"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "@/components/link";
import { LayoutDashboard, Plus } from "lucide-react";
import { FeedCard, type FeedCardSubmission } from "@/components/feed-card";
import { FavoritesProvider } from "@/components/favorites-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { SubmissionEditModal } from "@/components/submission-edit-modal";

interface FeedListProps {
  initialSubmissions: FeedCardSubmission[];
  initialHasMore: boolean;
  initialNextCursor: string | null;
  isLoggedIn: boolean;
  currentUserId?: string | null;
  showActionBar?: boolean;
}

function FeedSkeleton() {
  return (
    <div className="border-b border-border">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      {/* Image area */}
      <Skeleton className="aspect-square w-full rounded-none" />
      {/* Action bar */}
      <div className="flex gap-3 px-4 py-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
      {/* Caption */}
      <div className="px-4 pb-4 space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}

function FeedListContent({
  initialSubmissions,
  initialHasMore,
  initialNextCursor,
  isLoggedIn,
  currentUserId,
  showActionBar = false,
}: FeedListProps) {
  const t = useTranslations("feed");
  const router = useRouter();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !nextCursor) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ cursor: nextCursor, take: "20" });
      const response = await fetch(`/api/feed?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to load feed");

      const data = await response.json();
      setSubmissions((prev) => [...prev, ...(data.submissions || [])]);
      setHasMore(Boolean(data.hasMore));
      setNextCursor(data.nextCursor || null);
    } catch {
      // Silently fail — sentinel won't re-trigger until scroll
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, nextCursor]);

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  const fab = showActionBar && isLoggedIn && (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => setIsCreateModalOpen(true)}
        title={t("newPost")}
        aria-label={t("newPost")}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="h-5 w-5" />
      </button>
      <Link
        href="/dashboard"
        title={t("dashboard")}
        aria-label={t("dashboard")}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-foreground shadow-lg ring-1 ring-border transition-transform hover:scale-105 active:scale-95"
      >
        <LayoutDashboard className="h-5 w-5" />
      </Link>
    </div>
  );

  if (submissions.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20 text-center px-6">
          <p className="text-muted-foreground">{t("empty")}</p>
        </div>
        {fab}
        {isLoggedIn && (
          <SubmissionEditModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            mode="create"
            onSuccess={() => router.refresh()}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div>
        {submissions.map((submission, index) => (
          <FeedCard
            key={submission.id}
            submission={submission}
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
            priority={index < 3}
          />
        ))}
        {isLoading && (
          <>
            <FeedSkeleton />
            <FeedSkeleton />
          </>
        )}
        {hasMore && <div ref={sentinelRef} className="h-4" />}
        {!hasMore && submissions.length > 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("end")}
          </p>
        )}
      </div>
      {fab}
      {isLoggedIn && (
        <SubmissionEditModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}

export function FeedList({
  initialSubmissions,
  initialHasMore,
  initialNextCursor,
  isLoggedIn,
  currentUserId,
  showActionBar = false,
}: FeedListProps) {
  const submissionIds = initialSubmissions.map((s) => s.id);

  return (
    <FavoritesProvider
      isLoggedIn={isLoggedIn}
      initialSubmissionIds={submissionIds}
    >
      <FeedListContent
        initialSubmissions={initialSubmissions}
        initialHasMore={initialHasMore}
        initialNextCursor={initialNextCursor}
        isLoggedIn={isLoggedIn}
        currentUserId={currentUserId}
        showActionBar={showActionBar}
      />
    </FavoritesProvider>
  );
}
