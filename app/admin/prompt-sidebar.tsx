"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import type { Prompt } from "@/app/generated/prisma/client";
import {
  formatDateRangeUTC,
  daysBetween,
  isCurrentPrompt,
} from "@/lib/date-utils";
import { ConfirmModal } from "@/components/confirm-modal";

type PromptWithSubmissionCount = Prompt & { _count: { submissions: number } };

interface PromptSidebarProps {
  prompts: PromptWithSubmissionCount[];
  onEditPrompt: (promptId: string) => void;
  editingPromptId: string | null;
}

export function PromptSidebar({
  prompts,
  onEditPrompt,
  editingPromptId,
}: PromptSidebarProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleDeleteClick(e: React.MouseEvent, promptId: string) {
    e.stopPropagation();
    setConfirmDeleteId(promptId);
    setError(null);
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return;

    setDeletingId(confirmDeleteId);
    try {
      const response = await fetch(`/api/prompts?id=${confirmDeleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete prompt");
        return;
      }

      setConfirmDeleteId(null);
      router.refresh();
    } catch {
      setError("An error occurred while deleting");
    } finally {
      setDeletingId(null);
    }
  }

  function handleCancelDelete() {
    setConfirmDeleteId(null);
    setError(null);
  }

  const promptToDelete = prompts.find((p) => p.id === confirmDeleteId);

  const { currentPrompt, nextPrompt } = useMemo(() => {
    const now = new Date();
    let current: PromptWithSubmissionCount | null = null;
    let next: PromptWithSubmissionCount | null = null;

    for (const prompt of prompts) {
      const weekStart = new Date(prompt.weekStart);
      const weekEnd = new Date(prompt.weekEnd);

      if (isCurrentPrompt(weekStart, weekEnd)) {
        current = prompt;
      } else if (
        weekStart > now &&
        (!next || weekStart < new Date(next.weekStart))
      ) {
        next = prompt;
      }
    }

    return { currentPrompt: current, nextPrompt: next };
  }, [prompts]);

  return (
    <div className="space-y-2">
      {prompts.map((prompt) => {
        const isEditing = editingPromptId === prompt.id;
        const canEdit = prompt._count.submissions === 0;
        const weekStart = new Date(prompt.weekStart);
        const weekEnd = new Date(prompt.weekEnd);
        const isCurrent = currentPrompt?.id === prompt.id;
        const isNext = nextPrompt?.id === prompt.id;

        let daysInfo: string | null = null;
        if (isCurrent) {
          const now = new Date();
          const daysRemaining = daysBetween(now, weekEnd);
          daysInfo = `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`;
        } else if (isNext) {
          const now = new Date();
          const daysUntil = daysBetween(now, weekStart);
          daysInfo = `${daysUntil} day${daysUntil !== 1 ? "s" : ""} until next`;
        }

        return (
          <div
            key={prompt.id}
            className={`rounded-lg border p-3 transition-all ${
              isEditing
                ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                {prompt.word1}
              </span>
              <span className="text-zinc-400">/</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                {prompt.word2}
              </span>
              <span className="text-zinc-400">/</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white">
                {prompt.word3}
              </span>
            </div>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              {formatDateRangeUTC(weekStart, weekEnd)}
            </p>
            {daysInfo && (
              <p className="mb-2 text-xs font-medium text-blue-600 dark:text-blue-400">
                {daysInfo}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {prompt._count.submissions} submission
                {prompt._count.submissions !== 1 ? "s" : ""}
              </span>
              {canEdit && (
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-800 dark:text-blue-200">
                      Editing
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditPrompt(prompt.id)}
                        className="rounded px-2 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, prompt.id)}
                        disabled={deletingId === prompt.id}
                        className="rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        {deletingId === prompt.id ? "..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Prompt"
        message={
          error
            ? error
            : promptToDelete
              ? `Are you sure you want to delete the prompt "${promptToDelete.word1} / ${promptToDelete.word2} / ${promptToDelete.word3}"? This action cannot be undone.`
              : "Are you sure you want to delete this prompt?"
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={!!deletingId}
      />
    </div>
  );
}
