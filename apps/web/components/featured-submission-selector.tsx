"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { TextThumbnail } from "@/components/text-thumbnail";
import { Badge } from "@createspot/ui-primitives/badge";
import { Button } from "@createspot/ui-primitives/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@createspot/ui-primitives/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@createspot/ui-primitives/popover";
import { cn } from "@/lib/utils";

interface SubmissionOption {
  id: string;
  title: string | null;
  imageUrl: string | null;
  text: string | null;
  isPortfolio: boolean;
  tags: string[];
  category: string | null;
}

interface FeaturedSubmissionSelectorProps {
  submissions: SubmissionOption[];
  selectedSubmissionId: string;
  onChange: (submissionId: string) => void;
  label?: string;
  description?: string;
  emptyMessage?: string;
  noneLabel?: string;
  featuredLabel?: string;
}

export function FeaturedSubmissionSelector({
  submissions,
  selectedSubmissionId,
  onChange,
  label = "Featured Piece",
  description = "Select a work to feature",
  emptyMessage = "No work available yet.",
  noneLabel = "None",
  featuredLabel = "Featured",
}: FeaturedSubmissionSelectorProps) {
  const tCategories = useTranslations("categories");
  const tProfile = useTranslations("profile");
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getSubmissionLabel = (submission: SubmissionOption): string => {
    return submission.category
      ? tCategories(submission.category)
      : tProfile("portfolio");
  };

  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) {
      return submissions;
    }
    const normalized = searchQuery.toLowerCase();
    return submissions.filter((submission) => {
      const label = getSubmissionLabel(submission);
      return (
        submission.title?.toLowerCase().includes(normalized) ||
        label.toLowerCase().includes(normalized)
      );
    });
  }, [searchQuery, submissions]);

  const handleSelect = (submissionId: string) => {
    onChange(submissionId);
    setOpen(false);
    setSearchQuery("");
  };

  const selectedSubmission = submissions.find(
    (s) => s.id === selectedSubmissionId,
  );

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      {description && (
        <p className="mb-3 text-xs text-muted-foreground">{description}</p>
      )}
      {submissions.length > 0 ? (
        <Popover
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen);
            if (!nextOpen) {
              setSearchQuery("");
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="h-auto w-full justify-between px-4 py-3 text-left font-normal"
            >
              {selectedSubmission ? (
                <SubmissionPreview
                  submission={selectedSubmission}
                  getSubmissionLabel={getSubmissionLabel}
                  featuredLabel={featuredLabel}
                  isSelected
                />
              ) : (
                <span className="text-muted-foreground">{noneLabel}</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search work..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>
                  {searchQuery ? "No matching work found" : emptyMessage}
                </CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value={noneLabel}
                    onSelect={() => handleSelect("")}
                    className="px-4 py-3"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-medium">{noneLabel}</span>
                      <Check
                        className={cn(
                          "h-4 w-4 text-primary",
                          selectedSubmissionId === ""
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </div>
                  </CommandItem>
                  {filteredSubmissions.map((submission) => {
                    const isSelected = selectedSubmissionId === submission.id;
                    return (
                      <CommandItem
                        key={submission.id}
                        value={`${submission.title ?? ""} ${getSubmissionLabel(submission)}`.trim()}
                        onSelect={() => handleSelect(submission.id)}
                        className="px-4 py-3"
                      >
                        <div className="flex w-full items-center gap-3">
                          <SubmissionThumbnail
                            submission={submission}
                            label={getSubmissionLabel(submission)}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                {getSubmissionLabel(submission)}
                              </span>
                              {submission.isPortfolio && (
                                <Badge className="bg-prompt/15 text-prompt-foreground hover:bg-prompt/25">
                                  {tProfile("portfolio")}
                                </Badge>
                              )}
                              {isSelected && (
                                <span className="text-xs text-muted-foreground">
                                  {featuredLabel}
                                </span>
                              )}
                            </div>
                            {submission.title && (
                              <p className="truncate text-sm font-medium text-popover-foreground">
                                {submission.title}
                              </p>
                            )}
                          </div>
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0 text-primary",
                              isSelected ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}

interface SubmissionPreviewProps {
  submission: SubmissionOption;
  getSubmissionLabel: (submission: SubmissionOption) => string;
  featuredLabel: string;
  isSelected?: boolean;
}

function SubmissionPreview({
  submission,
  getSubmissionLabel,
  featuredLabel,
  isSelected = false,
}: SubmissionPreviewProps) {
  const label = getSubmissionLabel(submission);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <SubmissionThumbnail submission={submission} label={label} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          {isSelected && (
            <span className="text-xs text-muted-foreground">
              {featuredLabel}
            </span>
          )}
        </div>
        {submission.title && (
          <p className="truncate text-sm font-medium text-foreground">
            {submission.title}
          </p>
        )}
      </div>
    </div>
  );
}

interface SubmissionThumbnailProps {
  submission: SubmissionOption;
  label: string;
  size: "sm" | "md";
}

function SubmissionThumbnail({
  submission,
  label,
  size,
}: SubmissionThumbnailProps) {
  const className =
    size === "sm"
      ? "relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted"
      : "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800";
  if (submission.imageUrl) {
    return (
      <div className={className}>
        <Image
          src={submission.imageUrl}
          alt={submission.title || label}
          fill
          className="object-cover"
          sizes={size === "sm" ? "40px" : "48px"}
        />
      </div>
    );
  }
  if (submission.text) {
    return (
      <TextThumbnail
        text={submission.text}
        className={
          size === "sm"
            ? "h-10 w-10 shrink-0 rounded-lg"
            : "h-12 w-12 shrink-0 rounded-lg"
        }
      />
    );
  }
  return (
    <div
      className={
        size === "sm"
          ? "h-10 w-10 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800"
          : "h-12 w-12 shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800"
      }
    />
  );
}
