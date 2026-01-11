"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { TextThumbnail } from "@/components/text-thumbnail";
import { Badge } from "@/components/ui/badge";

interface SubmissionOption {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  wordIndex: number | null;
  isPortfolio: boolean;
  tags: string[];
  category: string | null;
  prompt: {
    word1: string;
    word2: string;
    word3: string;
  } | null;
}

interface FeaturedSubmissionSelectorProps {
  submissions: SubmissionOption[];
  selectedSubmissionId: string;
  onChange: (submissionId: string) => void;
  label?: string;
  description?: string;
  emptyMessage?: string;
}

export function FeaturedSubmissionSelector({
  submissions,
  selectedSubmissionId,
  onChange,
  label = "Featured Piece",
  description = "Select a work to feature",
  emptyMessage = "No work available yet.",
}: FeaturedSubmissionSelectorProps) {
  const tCategories = useTranslations("categories");
  const tProfile = useTranslations("profile");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getSubmissionLabel = (submission: SubmissionOption): string => {
    if (submission.prompt && submission.wordIndex) {
      return [
        submission.prompt.word1,
        submission.prompt.word2,
        submission.prompt.word3,
      ][submission.wordIndex - 1];
    }
    return submission.category
      ? tCategories(submission.category)
      : tProfile("portfolio");
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSelect = (submissionId: string) => {
    onChange(submissionId);
    setIsDropdownOpen(false);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      {description && (
        <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      )}
      {submissions.length > 0 ? (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-4 py-3 text-left text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            {(() => {
              const selected = submissions.find(
                (s) => s.id === selectedSubmissionId,
              );
              if (!selected) {
                return <span className="text-muted-foreground">None</span>;
              }
              const word = getSubmissionLabel(selected);
              return (
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {selected.imageUrl ? (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={selected.imageUrl}
                        alt={selected.title || word}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  ) : selected.text ? (
                    <TextThumbnail
                      text={selected.text}
                      className="h-10 w-10 shrink-0 rounded-lg"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {word}
                      </span>
                    </div>
                    {selected.title && (
                      <p className="truncate text-sm font-medium text-foreground">
                        {selected.title}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}
            <svg
              className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => handleSelect("")}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    selectedSubmissionId === ""
                      ? "bg-accent text-accent-foreground"
                      : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <span className="text-sm font-medium">None</span>
                </button>
                {submissions.map((submission) => {
                  const word = getSubmissionLabel(submission);
                  const isSelected = selectedSubmissionId === submission.id;
                  return (
                    <button
                      key={submission.id}
                      type="button"
                      onClick={() => handleSelect(submission.id)}
                      className={`w-full px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {submission.imageUrl ? (
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            <Image
                              src={submission.imageUrl}
                              alt={submission.title || word}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : submission.text ? (
                          <TextThumbnail
                            text={submission.text}
                            className="h-12 w-12 shrink-0 rounded-lg"
                          />
                        ) : (
                          <div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                              {word}
                            </span>
                            {submission.isPortfolio && (
                              <Badge className="bg-prompt/15 text-prompt-foreground hover:bg-prompt/25">
                                Portfolio
                              </Badge>
                            )}
                            {isSelected && (
                              <span className="text-xs text-muted-foreground">
                                (Featured)
                              </span>
                            )}
                          </div>
                          {submission.title && (
                            <p className="truncate text-sm font-medium text-popover-foreground">
                              {submission.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}
