"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Prompt } from "@/app/generated/prisma/client";

interface PromptFormProps {
  prompt: Prompt | null;
}

export function PromptForm({ prompt }: PromptFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [word1, setWord1] = useState(prompt?.word1 || "");
  const [word2, setWord2] = useState(prompt?.word2 || "");
  const [word3, setWord3] = useState(prompt?.word3 || "");
  const [weekStart, setWeekStart] = useState(
    prompt?.weekStart
      ? new Date(prompt.weekStart).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [weekEnd, setWeekEnd] = useState(
    prompt?.weekEnd
      ? new Date(prompt.weekEnd).toISOString().split("T")[0]
      : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const method = prompt ? "PUT" : "POST";
      const body = prompt
        ? { id: prompt.id, word1, word2, word3, weekStart, weekEnd }
        : { word1, word2, word3, weekStart, weekEnd };

      const response = await fetch("/api/prompts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save prompt");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="word1"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Word 1
          </label>
          <input
            type="text"
            id="word1"
            value={word1}
            onChange={(e) => setWord1(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="word2"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Word 2
          </label>
          <input
            type="text"
            id="word2"
            value={word2}
            onChange={(e) => setWord2(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="word3"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Word 3
          </label>
          <input
            type="text"
            id="word3"
            value={word3}
            onChange={(e) => setWord3(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="weekStart"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Week Start
          </label>
          <input
            type="date"
            id="weekStart"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="weekEnd"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Week End (optional, defaults to +7 days)
          </label>
          <input
            type="date"
            id="weekEnd"
            value={weekEnd}
            onChange={(e) => setWeekEnd(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isLoading ? "Saving..." : prompt ? "Update Prompt" : "Create Prompt"}
      </button>
    </form>
  );
}
