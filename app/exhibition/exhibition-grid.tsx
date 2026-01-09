"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { TextThumbnail } from "@/components/text-thumbnail";
import { FavoriteButton } from "@/components/favorite-button";
import { FavoritesProvider } from "@/components/favorites-provider";
import { SubmissionLightbox } from "@/components/submission-lightbox";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";
import { Card, CardContent } from "@/components/ui/card";

interface ExhibitionSubmission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  tags: string[];
  category: string | null;
  wordIndex: number | null;
  createdAt: string | Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  prompt: {
    word1: string;
    word2: string;
    word3: string;
  } | null;
}

interface ExhibitionGridProps {
  submissions: ExhibitionSubmission[];
  isLoggedIn: boolean;
  initialHasMore: boolean;
}

export function ExhibitionGrid({
  submissions,
  isLoggedIn,
  initialHasMore,
}: ExhibitionGridProps) {
  const [items, setItems] = useState(submissions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextSkip, setNextSkip] = useState(submissions.length);
  const searchParams = useSearchParams();
  const queryString = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    setItems(submissions);
    setHasMore(initialHasMore);
    setNextSkip(submissions.length);
    setLoadError(null);
  }, [initialHasMore, submissions]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams(queryString);
      params.set("skip", nextSkip.toString());
      params.set("take", `${EXHIBITION_PAGE_SIZE}`);

      const response = await fetch(`/api/exhibition?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load more work");
      }

      const data = await response.json();

      setItems((prev) => [...prev, ...(data.submissions || [])]);
      setHasMore(Boolean(data.hasMore));
      setNextSkip((prev) => prev + (data.submissions?.length || 0));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load more work",
      );
    } finally {
      setIsLoading(false);
    }
  }, [queryString, nextSkip, isLoading, hasMore]);

  const submissionIds = items.map((submission) => submission.id);

  return (
    <FavoritesProvider
      isLoggedIn={isLoggedIn}
      initialSubmissionIds={submissionIds}
    >
      <GridContent
        submissions={items}
        isLoggedIn={isLoggedIn}
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={loadMore}
        loadError={loadError}
      />
    </FavoritesProvider>
  );
}

function GridContent({
  submissions,
  isLoggedIn,
  hasMore,
  isLoading,
  onLoadMore,
  loadError,
}: Omit<ExhibitionGridProps, "initialHasMore"> & {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  loadError: string | null;
}) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<ExhibitionSubmission | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const getWord = (submission: ExhibitionSubmission): string => {
    if (!submission.prompt || !submission.wordIndex) return "";
    const words = [
      submission.prompt.word1,
      submission.prompt.word2,
      submission.prompt.word3,
    ];
    return words[submission.wordIndex - 1];
  };

  useEffect(() => {
    if (!hasMore) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (submissions.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed">
        <CardContent className="px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No work matches these filters yet.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try removing a filter or searching with a different keyword.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <motion.div
        layout
        className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        <AnimatePresence mode="popLayout">
          {submissions.map((submission) => {
            return (
              <motion.article
                key={submission.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                whileHover={{ y: -4 }}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                onClick={() => setSelectedSubmission(submission)}
              >
                {submission.imageUrl ? (
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={submission.imageUrl}
                      alt={submission.title || "Submission"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {isLoggedIn && (
                      <div
                        className="absolute right-2 top-2 z-10"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <FavoriteButton
                          submissionId={submission.id}
                          size="sm"
                        />
                      </div>
                    )}
                    {submission.text && (
                      <div className="absolute left-2 bottom-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h7"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Hover overlay with creator name and title */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/60 to-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="px-4 text-center">
                        <h3 className="mb-2 text-lg font-semibold text-white drop-shadow-lg">
                          {submission.title || "Untitled"}
                        </h3>
                        <p className="text-sm font-medium text-white/90 drop-shadow-md">
                          {submission.user.name || "Anonymous"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : submission.text ? (
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <TextThumbnail
                      text={submission.text}
                      className="h-full w-full"
                    />
                    {isLoggedIn && (
                      <div
                        className="absolute right-2 top-2 z-10"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <FavoriteButton
                          submissionId={submission.id}
                          size="sm"
                        />
                      </div>
                    )}
                    {/* Hover overlay with creator name and title */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/60 to-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="px-4 text-center">
                        <h3 className="mb-2 text-lg font-semibold text-white drop-shadow-lg">
                          {submission.title || "Untitled"}
                        </h3>
                        <p className="text-sm font-medium text-white/90 drop-shadow-md">
                          {submission.user.name || "Anonymous"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <div ref={sentinelRef} className="h-10" />
      <div className="mt-4 flex flex-col items-center gap-2 text-sm text-muted-foreground">
        {isLoading && <span>Loading more work...</span>}
        {loadError && (
          <div className="flex items-center gap-3">
            <span className="text-red-500 dark:text-red-400">{loadError}</span>
            <button
              type="button"
              onClick={onLoadMore}
              className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              Retry
            </button>
          </div>
        )}
        {!hasMore && submissions.length > 0 && (
          <span className="text-muted-foreground">
            You&apos;ve reached the end.
          </span>
        )}
      </div>

      {selectedSubmission && (
        <SubmissionLightbox
          submission={selectedSubmission}
          word={getWord(selectedSubmission)}
          onClose={() => setSelectedSubmission(null)}
          isOpen={!!selectedSubmission}
        />
      )}
    </>
  );
}
