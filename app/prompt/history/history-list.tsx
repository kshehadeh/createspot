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
        take: "5",
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
        <p className="text-muted-foreground">
          You haven&apos;t submitted any prompts yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((prompt) => (
        <div
          key={prompt.id}
          className="rounded-lg border border-border bg-card p-3 md:p-4"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="w-full shrink-0 md:w-48 md:sticky md:top-4 flex flex-col justify-center">
              <p className="text-sm font-medium text-foreground">
                {formatDateRangeUTC(
                  new Date(prompt.weekStart),
                  new Date(prompt.weekEnd),
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {prompt.word1} &middot; {prompt.word2} &middot; {prompt.word3}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 flex-wrap gap-6">
              {[1, 2, 3].map((wordIndex) => {
                const submission = prompt.submissions.find(
                  (s) => s.wordIndex === wordIndex,
                );
                const word = getWordForIndex(prompt, wordIndex);

                if (submission) {
                  return (
                    <button
                      key={submission.id}
                      type="button"
                      onClick={() => setSelected({ submission, word })}
                      className="flex flex-col items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                    >
                      {submission.imageUrl ? (
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={submission.imageUrl}
                            alt={submission.title || word}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        </div>
                      ) : submission.text ? (
                        <TextThumbnail
                          text={submission.text}
                          className="h-24 w-24 shrink-0 rounded-lg"
                        />
                      ) : null}
                      <p className="text-xs text-center text-foreground">
                        {word}
                      </p>
                    </button>
                  );
                }

                // Missing submission - show placeholder
                return (
                  <div
                    key={`missing-${wordIndex}`}
                    className="flex flex-col items-center gap-3 rounded-lg p-2"
                  >
                    <div className="h-24 w-24 shrink-0 rounded-lg border-2 border-dashed border-border bg-muted/30" />
                    <p className="text-xs text-center text-muted-foreground">
                      {word}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="border-t border-border pt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
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
          isOpen={!!selected}
        />
      )}
    </div>
  );
}
