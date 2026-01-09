"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Prompt } from "@/app/generated/prisma/client";
import { formatDateRangeUTC } from "@/lib/date-utils";
import { ConfirmModal } from "@/components/confirm-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const dictionaryCache = new Map<string, boolean>();

async function isValidWord(word: string): Promise<boolean> {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return true;

  if (dictionaryCache.has(trimmed)) {
    return dictionaryCache.get(trimmed)!;
  }

  try {
    const response = await fetch(
      `/api/words/validate?word=${encodeURIComponent(trimmed)}`,
    );
    if (!response.ok) return true;
    const data = await response.json();
    const isValid = data.valid === true;
    dictionaryCache.set(trimmed, isValid);
    return isValid;
  } catch {
    return true;
  }
}

async function getRandomWord(): Promise<string | null> {
  try {
    const response = await fetch("/api/words/random");
    if (!response.ok) return null;
    const data = await response.json();
    return data.word || null;
  } catch {
    return null;
  }
}

type PromptWithSubmissionCount = Prompt & { _count: { submissions: number } };

interface PromptFormProps {
  prompts: PromptWithSubmissionCount[];
  externalSelectedPromptId?: string | null;
  onSelectionHandled?: () => void;
  onModeChange?: (mode: "create" | "edit", promptId?: string) => void;
}

function getMondayUTC(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  // Set to start of day (00:00:00.000)
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function getSundayUTC(monday: Date): Date {
  const d = new Date(monday);
  d.setUTCDate(d.getUTCDate() + 6);
  // Set to end of day (23:59:59.999)
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function formatWeekFromMondayUTC(monday: Date): string {
  const sunday = getSundayUTC(monday);
  return formatDateRangeUTC(monday, sunday);
}

function getWeekKey(monday: Date): string {
  return monday.toISOString().split("T")[0];
}

function getRecentlyUsedWords(
  prompts: PromptWithSubmissionCount[],
): Map<string, Date> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const wordMap = new Map<string, Date>();

  for (const prompt of prompts) {
    const promptDate = new Date(prompt.weekStart);
    if (promptDate >= oneYearAgo) {
      const words = [prompt.word1, prompt.word2, prompt.word3];
      for (const word of words) {
        const lowerWord = word.toLowerCase();
        const existingDate = wordMap.get(lowerWord);
        if (!existingDate || promptDate > existingDate) {
          wordMap.set(lowerWord, promptDate);
        }
      }
    }
  }

  return wordMap;
}

export function PromptForm({
  prompts,
  externalSelectedPromptId,
  onSelectionHandled,
  onModeChange,
}: PromptFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");

  const selectedPrompt = prompts.find((p) => p.id === selectedPromptId);
  const hasSubmissions = selectedPrompt
    ? selectedPrompt._count.submissions > 0
    : false;

  const [word1, setWord1] = useState("");
  const [word2, setWord2] = useState("");
  const [word3, setWord3] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");

  const [word1Invalid, setWord1Invalid] = useState(false);
  const [word2Invalid, setWord2Invalid] = useState(false);
  const [word3Invalid, setWord3Invalid] = useState(false);
  const [checkingWords, setCheckingWords] = useState<Set<number>>(new Set());
  const [loadingRandomWord, setLoadingRandomWord] = useState<Set<number>>(
    new Set(),
  );

  const debounceTimers = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const checkWord = useCallback(
    async (
      word: string,
      wordIndex: number,
      setInvalid: (v: boolean) => void,
    ) => {
      if (debounceTimers.current[wordIndex]) {
        clearTimeout(debounceTimers.current[wordIndex]);
      }

      if (!word.trim() || mode !== "create") {
        setInvalid(false);
        setCheckingWords((prev) => {
          const next = new Set(prev);
          next.delete(wordIndex);
          return next;
        });
        return;
      }

      setCheckingWords((prev) => new Set(prev).add(wordIndex));

      debounceTimers.current[wordIndex] = setTimeout(async () => {
        const valid = await isValidWord(word);
        setInvalid(!valid);
        setCheckingWords((prev) => {
          const next = new Set(prev);
          next.delete(wordIndex);
          return next;
        });
      }, 500);
    },
    [mode],
  );

  useEffect(() => {
    checkWord(word1, 1, setWord1Invalid);
  }, [word1, checkWord]);

  useEffect(() => {
    checkWord(word2, 2, setWord2Invalid);
  }, [word2, checkWord]);

  useEffect(() => {
    checkWord(word3, 3, setWord3Invalid);
  }, [word3, checkWord]);

  useEffect(() => {
    if (externalSelectedPromptId) {
      const prompt = prompts.find((p) => p.id === externalSelectedPromptId);
      if (prompt && prompt._count.submissions === 0) {
        setMode("edit");
        setSelectedPromptId(externalSelectedPromptId);
        setWord1(prompt.word1);
        setWord2(prompt.word2);
        setWord3(prompt.word3);
        setSelectedWeek(getWeekKey(getMondayUTC(new Date(prompt.weekStart))));
        setError(null);
      }
      onSelectionHandled?.();
    }
  }, [externalSelectedPromptId, prompts, onSelectionHandled, onModeChange]);

  const takenWeekKeys = useMemo(() => {
    return new Set(
      prompts.map((p) => getWeekKey(getMondayUTC(new Date(p.weekStart)))),
    );
  }, [prompts]);

  const recentlyUsedWords = useMemo(() => {
    return getRecentlyUsedWords(prompts);
  }, [prompts]);

  function getRecentlyUsedWarning(word: string): string | null {
    if (!word.trim() || mode !== "create") return null;
    const lastUsed = recentlyUsedWords.get(word.toLowerCase().trim());
    if (lastUsed) {
      const monthsAgo = Math.floor(
        (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24 * 30),
      );
      if (monthsAgo < 1) {
        return `"${word}" was used less than a month ago`;
      }
      return `"${word}" was used ${monthsAgo} month${monthsAgo === 1 ? "" : "s"} ago`;
    }
    return null;
  }

  const word1RecentWarning = getRecentlyUsedWarning(word1);
  const word2RecentWarning = getRecentlyUsedWarning(word2);
  const word3RecentWarning = getRecentlyUsedWarning(word3);

  const word1DictWarning =
    word1Invalid && mode === "create"
      ? `"${word1}" may not be a valid dictionary word`
      : null;
  const word2DictWarning =
    word2Invalid && mode === "create"
      ? `"${word2}" may not be a valid dictionary word`
      : null;
  const word3DictWarning =
    word3Invalid && mode === "create"
      ? `"${word3}" may not be a valid dictionary word`
      : null;

  const word1Warning = word1RecentWarning || word1DictWarning;
  const word2Warning = word2RecentWarning || word2DictWarning;
  const word3Warning = word3RecentWarning || word3DictWarning;

  const word1Checking = checkingWords.has(1);
  const word2Checking = checkingWords.has(2);
  const word3Checking = checkingWords.has(3);

  async function fillRandomWord(
    wordIndex: number,
    setWord: (word: string) => void,
  ) {
    setLoadingRandomWord((prev) => new Set(prev).add(wordIndex));
    try {
      const word = await getRandomWord();
      if (word) {
        setWord(word);
      }
    } finally {
      setLoadingRandomWord((prev) => {
        const next = new Set(prev);
        next.delete(wordIndex);
        return next;
      });
    }
  }

  const availableWeeks = useMemo(() => {
    const weeks: { key: string; label: string; monday: Date }[] = [];
    const today = new Date();
    const currentMonday = getMondayUTC(today);

    for (let i = 0; i < 8; i++) {
      const monday = new Date(currentMonday);
      monday.setDate(monday.getDate() + i * 7);
      const key = getWeekKey(monday);
      if (!takenWeekKeys.has(key)) {
        weeks.push({ key, label: formatWeekFromMondayUTC(monday), monday });
      }
    }
    return weeks;
  }, [takenWeekKeys]);

  const editablePrompts = prompts.filter((p) => p._count.submissions === 0);

  function handleModeChange(newMode: "create" | "edit") {
    setMode(newMode);
    setError(null);
    if (newMode === "create") {
      setSelectedPromptId("");
      setWord1("");
      setWord2("");
      setWord3("");
      setSelectedWeek(availableWeeks[0]?.key || "");
      onModeChange?.("create");
    } else {
      const firstEditable = editablePrompts[0];
      if (firstEditable) {
        setSelectedPromptId(firstEditable.id);
        setWord1(firstEditable.word1);
        setWord2(firstEditable.word2);
        setWord3(firstEditable.word3);
        setSelectedWeek(
          getWeekKey(getMondayUTC(new Date(firstEditable.weekStart))),
        );
        onModeChange?.("edit", firstEditable.id);
      }
    }
  }

  function handlePromptSelect(promptId: string) {
    setSelectedPromptId(promptId);
    const prompt = prompts.find((p) => p.id === promptId);
    if (prompt) {
      setWord1(prompt.word1);
      setWord2(prompt.word2);
      setWord3(prompt.word3);
      setSelectedWeek(getWeekKey(getMondayUTC(new Date(prompt.weekStart))));
      onModeChange?.("edit", promptId);
    }
  }

  function handleDeleteClick() {
    if (!selectedPromptId || hasSubmissions) return;
    setShowDeleteConfirm(true);
  }

  async function handleConfirmDelete() {
    if (!selectedPromptId) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/prompts?id=${selectedPromptId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete prompt");
      }

      setShowDeleteConfirm(false);
      setSelectedPromptId("");
      setWord1("");
      setWord2("");
      setWord3("");
      setMode("create");
      onModeChange?.("create");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleCancelDelete() {
    setShowDeleteConfirm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const method = mode === "edit" ? "PUT" : "POST";
      let body;

      if (mode === "edit") {
        body = {
          id: selectedPromptId,
          word1,
          word2,
          word3,
        };
      } else {
        const weekMonday = new Date(selectedWeek);
        const weekSunday = getSundayUTC(weekMonday);
        body = {
          word1,
          word2,
          word3,
          weekStart: weekMonday.toISOString(),
          weekEnd: weekSunday.toISOString(),
        };
      }

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
      if (mode === "create") {
        setWord1("");
        setWord2("");
        setWord3("");
        setSelectedWeek("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button
          type="button"
          onClick={() => handleModeChange("create")}
          variant={mode === "create" ? "default" : "outline"}
        >
          Create New Prompt
        </Button>
        <Button
          type="button"
          onClick={() => handleModeChange("edit")}
          disabled={editablePrompts.length === 0}
          variant={mode === "edit" ? "default" : "outline"}
        >
          Edit Existing Prompt
        </Button>
      </div>

      {mode === "edit" && editablePrompts.length > 0 && (
        <div>
          <Label htmlFor="promptSelect">Select Prompt to Edit</Label>
          <Select
            value={selectedPromptId}
            onValueChange={handlePromptSelect}
          >
            <SelectTrigger id="promptSelect" className="w-full">
              <SelectValue placeholder="Select a prompt..." />
            </SelectTrigger>
            <SelectContent>
              {editablePrompts.map((prompt) => (
                <SelectItem key={prompt.id} value={prompt.id}>
                  {prompt.word1} / {prompt.word2} / {prompt.word3} (
                  {formatDateRangeUTC(
                    new Date(prompt.weekStart),
                    new Date(prompt.weekEnd),
                  )}
                  )
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            Only prompts without submissions can be edited
          </p>
        </div>
      )}

      {mode === "edit" && editablePrompts.length === 0 && (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          All existing prompts have submissions and cannot be edited.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {hasSubmissions && mode === "edit" && (
          <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            This prompt has submissions and cannot be modified.
          </div>
        )}

        {mode === "create" ? (
          <div>
            <Label htmlFor="weekSelect">Week (Monday - Sunday)</Label>
            <Select
              value={selectedWeek}
              onValueChange={setSelectedWeek}
              required
              disabled={availableWeeks.length === 0}
            >
              <SelectTrigger id="weekSelect" className="w-full">
                <SelectValue placeholder="Select a week..." />
              </SelectTrigger>
              <SelectContent>
                {availableWeeks.map((week) => (
                  <SelectItem key={week.key} value={week.key}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableWeeks.length === 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                All upcoming weeks already have prompts assigned
              </p>
            )}
          </div>
        ) : selectedPrompt ? (
          <div>
            <Label>Week</Label>
            <p className="rounded-lg border border-border bg-muted px-4 py-2 text-muted-foreground">
              {formatDateRangeUTC(
                new Date(selectedPrompt.weekStart),
                new Date(selectedPrompt.weekEnd),
              )}
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="word1">Word 1</Label>
            <div className="relative">
              <Input
                type="text"
                id="word1"
                value={word1}
                onChange={(e) => setWord1(e.target.value)}
                required
                disabled={hasSubmissions}
                className={cn(
                  "pr-10",
                  word1Warning &&
                    "border-amber-400 focus:border-amber-500 focus:ring-amber-500 dark:border-amber-500"
                )}
              />
              {mode === "create" && !hasSubmissions && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fillRandomWord(1, setWord1)}
                  disabled={loadingRandomWord.has(1)}
                  className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2"
                  title="Fill with random word"
                >
                  {loadingRandomWord.has(1) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <p className="mt-1 h-4 text-xs">
              {word1Checking ? (
                <span className="text-muted-foreground">
                  Checking...
                </span>
              ) : word1Warning ? (
                <span className="text-amber-600 dark:text-amber-400">
                  {word1Warning}
                </span>
              ) : null}
            </p>
          </div>
          <div>
            <Label htmlFor="word2">Word 2</Label>
            <div className="relative">
              <Input
                type="text"
                id="word2"
                value={word2}
                onChange={(e) => setWord2(e.target.value)}
                required
                disabled={hasSubmissions}
                className={cn(
                  "pr-10",
                  word2Warning &&
                    "border-amber-400 focus:border-amber-500 focus:ring-amber-500 dark:border-amber-500"
                )}
              />
              {mode === "create" && !hasSubmissions && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fillRandomWord(2, setWord2)}
                  disabled={loadingRandomWord.has(2)}
                  className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2"
                  title="Fill with random word"
                >
                  {loadingRandomWord.has(2) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <p className="mt-1 h-4 text-xs">
              {word2Checking ? (
                <span className="text-muted-foreground">
                  Checking...
                </span>
              ) : word2Warning ? (
                <span className="text-amber-600 dark:text-amber-400">
                  {word2Warning}
                </span>
              ) : null}
            </p>
          </div>
          <div>
            <Label htmlFor="word3">Word 3</Label>
            <div className="relative">
              <Input
                type="text"
                id="word3"
                value={word3}
                onChange={(e) => setWord3(e.target.value)}
                required
                disabled={hasSubmissions}
                className={cn(
                  "pr-10",
                  word3Warning &&
                    "border-amber-400 focus:border-amber-500 focus:ring-amber-500 dark:border-amber-500"
                )}
              />
              {mode === "create" && !hasSubmissions && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fillRandomWord(3, setWord3)}
                  disabled={loadingRandomWord.has(3)}
                  className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2"
                  title="Fill with random word"
                >
                  {loadingRandomWord.has(3) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <p className="mt-1 h-4 text-xs">
              {word3Checking ? (
                <span className="text-muted-foreground">
                  Checking...
                </span>
              ) : word3Warning ? (
                <span className="text-amber-600 dark:text-amber-400">
                  {word3Warning}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={
              isLoading ||
              isDeleting ||
              hasSubmissions ||
              (mode === "create" && availableWeeks.length === 0)
            }
          >
            {isLoading
              ? "Saving..."
              : mode === "edit"
                ? "Update Prompt"
                : "Create Prompt"}
          </Button>
          {mode === "edit" && selectedPromptId && !hasSubmissions && (
            <Button
              type="button"
              onClick={handleDeleteClick}
              disabled={isLoading || isDeleting}
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete Prompt"}
            </Button>
          )}
        </div>
      </form>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Prompt"
        message={
          selectedPrompt
            ? `Are you sure you want to delete the prompt "${selectedPrompt.word1} / ${selectedPrompt.word2} / ${selectedPrompt.word3}"? This action cannot be undone.`
            : "Are you sure you want to delete this prompt?"
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
