"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { TextThumbnail } from "@/components/text-thumbnail";
import { FavoriteButton } from "@/components/favorite-button";
import { FavoritesProvider } from "@/components/favorites-provider";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  const buildTagHref = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tag", tag);
    const next = params.toString();
    return next ? `/exhibition/gallery?${next}` : "/exhibition/gallery";
  };

  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No work matches these filters yet.
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
          Try removing a filter or searching with a different keyword.
        </p>
      </div>
    );
  }

  return (
    <>
      <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {submissions.map((submission) => {
            const promptWord =
              submission.prompt && submission.wordIndex
                ? [
                    submission.prompt.word1,
                    submission.prompt.word2,
                    submission.prompt.word3,
                  ][submission.wordIndex - 1]
                : null;

            return (
              <motion.article
                key={submission.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                whileHover={{ y: -4 }}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                onClick={() => router.push(`/s/${submission.id}`)}
              >
                {submission.imageUrl ? (
                  <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={submission.imageUrl}
                      alt={submission.title || "Submission"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {submission.text && (
                      <div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
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
                  </div>
                ) : submission.text ? (
                  <div className="relative">
                    <TextThumbnail
                      text={submission.text}
                      className="aspect-square"
                    />
                  </div>
                ) : null}

                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {submission.category && (
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {submission.category}
                      </span>
                    )}
                    {promptWord && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {promptWord}
                      </span>
                    )}
                  </div>

                  {submission.title && (
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      {submission.title}
                    </h3>
                  )}

                  {submission.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {submission.tags.slice(0, 4).map((tag) => (
                        <Link
                          key={tag}
                          href={buildTagHref(tag)}
                          onClick={(event) => event.stopPropagation()}
                          className="text-xs text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        >
                          #{tag}
                        </Link>
                      ))}
                      {submission.tags.length > 4 && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          +{submission.tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <Link
                      href={`/profile/${submission.user.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="flex items-center gap-2 transition hover:opacity-80"
                    >
                      {submission.user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={submission.user.image}
                          alt={submission.user.name || "User"}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                            {submission.user.name?.charAt(0).toUpperCase() ||
                              "?"}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-zinc-900 dark:text-white">
                          {submission.user.name || "Anonymous"}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-500">
                          {promptWord ? "Prompt response" : "Portfolio"}
                        </div>
                      </div>
                    </Link>

                    {isLoggedIn && (
                      <div onClick={(event) => event.stopPropagation()}>
                        <FavoriteButton submissionId={submission.id} size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>

      <div ref={sentinelRef} className="h-10" />
      <div className="mt-4 flex flex-col items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        {isLoading && <span>Loading more work...</span>}
        {loadError && (
          <div className="flex items-center gap-3">
            <span className="text-red-500 dark:text-red-400">{loadError}</span>
            <button
              type="button"
              onClick={onLoadMore}
              className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Retry
            </button>
          </div>
        )}
        {!hasMore && submissions.length > 0 && (
          <span className="text-zinc-400 dark:text-zinc-500">
            You&apos;ve reached the end.
          </span>
        )}
      </div>
    </>
  );
}
