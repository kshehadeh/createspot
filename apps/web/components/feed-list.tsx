"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "@/components/link";
import { HelpCircle, LayoutDashboard, LogIn, Plus } from "lucide-react";
import { FeedCard, type FeedCardSubmission } from "@/components/feed-card";
import { FavoritesProvider } from "@/components/favorites-provider";
import { Button } from "@createspot/ui-primitives/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SubmissionEditModal } from "@/components/submission-edit-modal";

const SubmissionLightbox = dynamic(
  () =>
    import("@/components/submission-lightbox").then(
      (mod) => mod.SubmissionLightbox,
    ),
  { ssr: false },
);

const CommentViewerModal = dynamic(
  () =>
    import("@/components/comment-viewer-modal").then(
      (mod) => mod.CommentViewerModal,
    ),
  { ssr: false },
);

function mapFeedSubmissionForLightbox(submission: FeedCardSubmission) {
  return {
    id: submission.id,
    title: submission.title,
    imageUrl: submission.imageUrl,
    text: submission.text,
    shareStatus: "PUBLIC" as const,
    critiquesEnabled: submission.critiquesEnabled,
    commentsEnabled: submission.commentsEnabled,
    user: {
      id: submission.user.id,
      name: submission.user.name,
      image: submission.user.image,
      slug: submission.user.slug,
    },
    _count: submission._count,
  };
}

interface FeedListProps {
  initialSubmissions: FeedCardSubmission[];
  initialHasMore: boolean;
  initialNextCursor: string | null;
  isLoggedIn: boolean;
  currentUserId?: string | null;
  showActionBar?: boolean;
  feedType?: "home" | "following" | "favorites";
}

function FeedSkeleton() {
  return (
    <div className="mb-5 overflow-hidden rounded-xl bg-surface-container-low shadow-[0_14px_35px_rgb(0_0_0_/_0.35)]">
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
  feedType = "home",
}: FeedListProps) {
  const t = useTranslations("feed");
  const tNav = useTranslations("navigation");
  const tFavoritesPage = useTranslations("favorites");
  const router = useRouter();
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lightboxSubmissionId, setLightboxSubmissionId] = useState<
    string | null
  >(null);
  const [commentsSubmissionId, setCommentsSubmissionId] = useState<
    string | null
  >(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleOpenLightbox = useCallback((id: string) => {
    setLightboxSubmissionId(id);
  }, []);

  const handleOpenComments = useCallback((id: string) => {
    setCommentsSubmissionId(id);
  }, []);

  useEffect(() => {
    if (
      lightboxSubmissionId &&
      !submissions.some((s) => s.id === lightboxSubmissionId)
    ) {
      setLightboxSubmissionId(null);
    }
  }, [submissions, lightboxSubmissionId]);

  useEffect(() => {
    if (
      commentsSubmissionId &&
      !submissions.some((s) => s.id === commentsSubmissionId)
    ) {
      setCommentsSubmissionId(null);
    }
  }, [submissions, commentsSubmissionId]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !nextCursor) return;
    if ((feedType === "following" || feedType === "favorites") && !isLoggedIn) {
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ cursor: nextCursor, take: "20" });
      const endpoint =
        feedType === "following"
          ? "/api/feed/following"
          : feedType === "favorites"
            ? "/api/feed/favorites"
            : "/api/feed";
      const response = await fetch(`${endpoint}?${params.toString()}`);
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
  }, [isLoading, hasMore, nextCursor, feedType, isLoggedIn]);

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
    <div
      className="fixed right-4 z-50 flex flex-col items-center gap-2.5 sm:right-6"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <Button
        type="button"
        variant="fabFilled"
        onClick={() => setIsCreateModalOpen(true)}
        title={t("newPost")}
        aria-label={t("newPost")}
      >
        <Plus className="h-5 w-5" />
      </Button>
      <Button
        variant="fabMuted"
        asChild
        title={t("dashboard")}
        aria-label={t("dashboard")}
      >
        <Link href="/dashboard">
          <LayoutDashboard className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );

  const guestActionBar = showActionBar && !isLoggedIn && (
    <div
      className="fixed right-4 z-50 flex flex-col items-center gap-2.5 sm:right-6"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
    >
      <Button
        variant="fabFilled"
        asChild
        title={tNav("overview")}
        aria-label={tNav("overview")}
      >
        <Link href="/about">
          <HelpCircle className="h-5 w-5" />
        </Link>
      </Button>
      <Button
        variant="fabMuted"
        asChild
        title={t("signIn")}
        aria-label={t("signIn")}
      >
        <Link href="/welcome">
          <LogIn className="h-5 w-5" />
        </Link>
      </Button>
    </div>
  );

  if (submissions.length === 0) {
    const emptyCopy =
      feedType === "following"
        ? t("followingEmpty")
        : feedType === "favorites"
          ? tFavoritesPage("empty")
          : t("empty");
    return (
      <>
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <p className="text-muted-foreground">{emptyCopy}</p>
          {feedType === "favorites" && (
            <Button
              asChild
              size="lg"
              className="mt-6 h-12 rounded-full px-8 text-sm font-medium"
            >
              <Link href="/inspire/exhibition">
                {tFavoritesPage("exploreExhibits")}
              </Link>
            </Button>
          )}
        </div>
        {fab}
        {guestActionBar}
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
            onOpenLightbox={handleOpenLightbox}
            onOpenComments={handleOpenComments}
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
      {guestActionBar}
      {isLoggedIn && (
        <SubmissionEditModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
          onSuccess={() => router.refresh()}
        />
      )}
      {lightboxSubmissionId &&
        (() => {
          const selected = submissions.find(
            (s) => s.id === lightboxSubmissionId,
          );
          if (!selected) return null;
          const currentIndex = submissions.findIndex(
            (s) => s.id === lightboxSubmissionId,
          );
          const hasPrevious = currentIndex > 0;
          const hasNext =
            currentIndex >= 0 && currentIndex < submissions.length - 1;
          return (
            <SubmissionLightbox
              submission={mapFeedSubmissionForLightbox(selected)}
              onClose={() => setLightboxSubmissionId(null)}
              isOpen
              currentUserId={currentUserId}
              onOpenComments={(id) => {
                setLightboxSubmissionId(null);
                setCommentsSubmissionId(id);
              }}
              navigation={{
                onGoToPrevious: () => {
                  if (hasPrevious) {
                    setLightboxSubmissionId(submissions[currentIndex - 1].id);
                  }
                },
                onGoToNext: () => {
                  if (hasNext) {
                    setLightboxSubmissionId(submissions[currentIndex + 1].id);
                  }
                },
                hasPrevious,
                hasNext,
                nextImageUrl: hasNext
                  ? (submissions[currentIndex + 1]?.imageUrl ?? null)
                  : null,
                prevImageUrl: hasPrevious
                  ? (submissions[currentIndex - 1]?.imageUrl ?? null)
                  : null,
              }}
            />
          );
        })()}
      {commentsSubmissionId &&
        (() => {
          const selected = submissions.find(
            (s) => s.id === commentsSubmissionId,
          );
          if (!selected) return null;
          return (
            <CommentViewerModal
              submission={{
                id: selected.id,
                title: selected.title,
                imageUrl: selected.imageUrl,
                user: selected.user,
                _count: selected._count,
              }}
              open
              onOpenChange={(open) => {
                if (!open) setCommentsSubmissionId(null);
              }}
              onCommentCountChange={(submissionId, newCount) => {
                setSubmissions((prev) =>
                  prev.map((s) =>
                    s.id === submissionId
                      ? {
                          ...s,
                          _count: { ...s._count, comments: newCount },
                        }
                      : s,
                  ),
                );
              }}
            />
          );
        })()}
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
  feedType = "home",
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
        feedType={feedType}
      />
    </FavoritesProvider>
  );
}
