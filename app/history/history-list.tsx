"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDateRangeUTC } from "@/lib/date-utils";
import { TextThumbnail } from "@/components/text-thumbnail";
import { SubmissionLightbox } from "@/components/submission-lightbox";

interface Submission {
  id: string;
  wordIndex: number | null;
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
  userId?: string;
}

export function HistoryList({
  initialItems,
  initialHasMore,
  userId,
}: HistoryListProps) {
  const [items, setItems] = useState<PromptWithSubmissions[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SelectedSubmission | null>(null);

  async function loadMore() {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: items.length.toString(),
        take: "10",
      });
      if (userId) params.set("userId", userId);
      const response = await fetch(`/api/history?${params}`);
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
          <div className="flex flex-col gap-6 py-6 md:flex-row md:items-center">
            <div className="w-full shrink-0 md:w-48">
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
                const word = submission.wordIndex ? getWordForIndex(prompt, submission.wordIndex) : "";
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
                      className="flex flex-col items-center gap-2 rounded-lg p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 md:flex-row md:gap-3"
                    >
                      {submission.imageUrl ? (
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 md:h-16 md:w-16">
                          <Image
                            src={submission.imageUrl}
                            alt={submission.title || word}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : submission.text ? (
                        <TextThumbnail
                          text={submission.text}
                          className="h-16 w-16 shrink-0 rounded-lg"
                        />
                      ) : null}
                      <div className="min-w-0 text-center md:text-left">
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
        <SubmissionLightbox
          submission={selected.submission}
          word={selected.word}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
