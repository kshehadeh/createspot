"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TextThumbnail } from "@/components/text-thumbnail";
import { getObjectPositionStyle } from "@/lib/image-utils";

interface Submission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint?: { x: number; y: number } | null;
  text: string | null;
  category: string | null;
}

interface SubmissionSelectorProps {
  onSelect: (submission: Submission) => void;
  excludeIds?: string[];
  placeholder?: string;
}

export function SubmissionSelector({
  onSelect,
  excludeIds = [],
  placeholder,
}: SubmissionSelectorProps) {
  const t = useTranslations("collections");

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchSubmissions = useCallback(
    async (query: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("take", "50");
        if (query) params.append("search", query);
        if (excludeIds.length > 0) {
          params.append("excludeIds", excludeIds.join(","));
        }

        const response = await fetch(
          `/api/portfolio/items?${params.toString()}`,
        );
        if (response.ok) {
          const data = await response.json();
          setSubmissions(data.items);
        }
      } catch (error) {
        console.error("Failed to fetch submissions:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [excludeIds],
  );

  // Fetch initial items when popover opens
  useEffect(() => {
    if (open && submissions.length === 0) {
      fetchSubmissions("");
    }
  }, [open, submissions.length, fetchSubmissions]);

  // Fetch when search changes
  useEffect(() => {
    if (open) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (search.length > 0) {
        setIsLoading(true);
        searchTimeoutRef.current = setTimeout(() => {
          fetchSubmissions(search);
        }, 300);
      }
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, open, fetchSubmissions]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSearch("");
      setSubmissions([]);
    }
  }, [open]);

  const handleSelect = (submission: Submission) => {
    setSelectedSubmission(submission);
    setOpen(false);
    setSearch("");
  };

  const handleAdd = () => {
    if (selectedSubmission) {
      onSelect(selectedSubmission);
      setSelectedSubmission(null);
    }
  };

  const displayLabel =
    selectedSubmission?.title ||
    selectedSubmission?.category ||
    "Select submission...";

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between"
          >
            {selectedSubmission ? (
              <span className="truncate">{displayLabel}</span>
            ) : (
              <span className="text-muted-foreground">
                {placeholder || t("selectSubmission")}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={t("searchSubmissions")}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isLoading && submissions.length === 0 && (
                <CommandEmpty>{t("noSubmissions")}</CommandEmpty>
              )}
              {!isLoading && submissions.length > 0 && (
                <CommandGroup>
                  {submissions.map((submission) => {
                    // Build searchable text from multiple fields
                    const searchTextParts = [
                      submission.title || "Untitled",
                      submission.category || "",
                      submission.text ? "text" : "", // Add "text" so text submissions are searchable
                    ].filter((p) => p.trim().length > 0);
                    return (
                      <CommandItem
                        key={submission.id}
                        value={submission.title || "Untitled"}
                        keywords={searchTextParts}
                        onSelect={() => handleSelect(submission)}
                        className={cn(
                          "data-[disabled]:pointer-events-auto data-[disabled]:opacity-100",
                        )}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedSubmission?.id === submission.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="relative h-8 w-8 shrink-0 rounded bg-muted overflow-hidden">
                            {submission.imageUrl ? (
                              <Image
                                src={submission.imageUrl}
                                alt={submission.title || "submission"}
                                fill
                                className="object-cover"
                                sizes="32px"
                                style={{
                                  objectPosition: getObjectPositionStyle(
                                    submission.imageFocalPoint,
                                  ),
                                }}
                              />
                            ) : submission.text ? (
                              <TextThumbnail
                                text={submission.text}
                                className="h-full w-full text-xs"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs">
                                ?
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate text-foreground">
                              {submission.title || "Untitled"}
                            </p>
                            {submission.category && (
                              <p className="text-xs text-foreground/70 truncate">
                                {submission.category}
                              </p>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        onClick={handleAdd}
        disabled={!selectedSubmission}
        size="icon"
        className="md:w-auto md:px-3"
      >
        <Plus className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">{t("addSubmission")}</span>
      </Button>
    </div>
  );
}
