"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ExhibitionGrid } from "@/app/inspire/exhibition/exhibition-grid";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";

interface Submission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  text: string | null;
  tags: string[];
  category: string | null;
  wordIndex: number | null;
  createdAt: string | Date;
  shareStatus: "PRIVATE" | "PROFILE" | "PUBLIC";
  critiquesEnabled: boolean;
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

interface ThisWeekContentProps {
  initialSubmissions: Submission[];
  promptId: string;
  words: string[];
  isLoggedIn: boolean;
  initialHasMore: boolean;
}

export function ThisWeekContent({
  initialSubmissions,
  promptId,
  words,
  isLoggedIn,
  initialHasMore,
}: ThisWeekContentProps) {
  const [allSubmissions, setAllSubmissions] = useState(initialSubmissions);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextSkip, setNextSkip] = useState(initialSubmissions.length);
  const [filter, setFilter] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Filter submissions based on selected word
  const filteredSubmissions = useMemo(() => {
    if (filter === null) {
      return allSubmissions;
    }
    return allSubmissions.filter((s) => s.wordIndex === filter);
  }, [allSubmissions, filter]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setLoadError(null);

    try {
      const params = new URLSearchParams({
        promptId,
        skip: nextSkip.toString(),
        take: `${EXHIBITION_PAGE_SIZE}`,
      });

      const response = await fetch(
        `/api/prompt/this-week?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error("loadMoreError");
      }

      const data = await response.json();

      setAllSubmissions((prev) => [...prev, ...(data.submissions || [])]);
      setHasMore(Boolean(data.hasMore));
      setNextSkip((prev) => prev + (data.submissions?.length || 0));
    } catch (error) {
      setLoadError(
        error instanceof Error && error.message !== "loadMoreError"
          ? error.message
          : "loadMoreError",
      );
    } finally {
      setIsLoading(false);
    }
  }, [promptId, nextSkip, isLoading, hasMore]);

  useEffect(() => {
    if (!hasMore) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoading) {
          loadMore();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, loadMore]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setFilter(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            filter === null
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          All
        </motion.button>
        {words.map((word, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(index + 1)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === index + 1
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {word}
          </motion.button>
        ))}
      </div>

      <ExhibitionGrid
        submissions={filteredSubmissions}
        isLoggedIn={isLoggedIn}
        initialHasMore={false}
        showWordInsteadOfTitle={true}
      />

      <div ref={sentinelRef} className="h-10" />
      <div className="mt-4 flex flex-col items-center gap-2 text-sm text-muted-foreground">
        {isLoading && <span>Loading more...</span>}
        {loadError && (
          <div className="flex items-center gap-3">
            <span className="text-red-500 dark:text-red-400">
              {loadError === "loadMoreError"
                ? "Failed to load more submissions"
                : loadError}
            </span>
            <button
              type="button"
              onClick={loadMore}
              className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:bg-accent hover:text-accent-foreground"
            >
              Retry
            </button>
          </div>
        )}
        {!hasMore &&
          allSubmissions.length > 0 &&
          filteredSubmissions.length === 0 && (
            <span className="text-muted-foreground">
              No submissions for this word yet.
            </span>
          )}
      </div>
    </div>
  );
}
