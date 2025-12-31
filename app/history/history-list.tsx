"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDateRangeUTC } from "@/lib/date-utils";

interface Submission {
  id: string;
  wordIndex: number;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
}

interface PromptWithSubmissions {
  id: string;
  weekStart: string;
  weekEnd: string;
  word1: string;
  word2: string;
  word3: string;
  submissions: Submission[];
}

interface SelectedSubmission {
  submission: Submission;
  word: string;
}

interface HistoryListProps {
  initialItems: PromptWithSubmissions[];
  initialHasMore: boolean;
}

export function HistoryList({
  initialItems,
  initialHasMore,
}: HistoryListProps) {
  const [items, setItems] = useState<PromptWithSubmissions[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SelectedSubmission | null>(null);

  async function loadMore() {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/history?skip=${items.length}&take=10`);
      if (!response.ok) throw new Error("Failed to load");

      const data = await response.json();
      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  }

  function getWordForIndex(
    prompt: PromptWithSubmissions,
    index: number,
  ): string {
    if (index === 1) return prompt.word1;
    if (index === 2) return prompt.word2;
    return prompt.word3;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-600 dark:text-zinc-400">
          You haven&apos;t submitted any prompts yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {items.map((prompt, index) => (
        <div key={prompt.id}>
          {index > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800" />
          )}
          <div className="flex items-center gap-6 py-6">
            <div className="w-48 shrink-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {formatDateRangeUTC(
                  new Date(prompt.weekStart),
                  new Date(prompt.weekEnd),
                )}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {prompt.word1} &middot; {prompt.word2} &middot; {prompt.word3}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
              {prompt.submissions.map((submission, subIndex) => {
                const word = getWordForIndex(prompt, submission.wordIndex);
                return (
                  <div
                    key={submission.id}
                    className="flex shrink-0 items-center gap-4"
                  >
                    {subIndex > 0 && (
                      <div className="h-12 w-px bg-zinc-200 dark:bg-zinc-700" />
                    )}
                    <button
                      type="button"
                      onClick={() => setSelected({ submission, word })}
                      className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {submission.imageUrl ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                          <Image
                            src={submission.imageUrl}
                            alt={submission.title || word}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : submission.text ? (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800">
                          <p className="line-clamp-3 text-[8px] leading-tight text-zinc-600 dark:text-zinc-400">
                            {submission.text
                              .replace(/<[^>]*>/g, "")
                              .slice(0, 100)}
                          </p>
                        </div>
                      ) : null}
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {word}
                        </p>
                        {submission.title && (
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {submission.title}
                          </p>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="border-t border-zinc-200 pt-6 text-center dark:border-zinc-800">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {selected.word}
            </p>

            {selected.submission.title && (
              <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
                {selected.submission.title}
              </h2>
            )}

            {selected.submission.imageUrl && (
              <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={selected.submission.imageUrl}
                  alt={selected.submission.title || selected.word}
                  fill
                  className="object-contain"
                  sizes="(max-width: 672px) 100vw, 672px"
                />
              </div>
            )}

            {selected.submission.text && (
              <div
                className="prose prose-zinc max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: selected.submission.text }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
