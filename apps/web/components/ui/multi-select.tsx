"use client";

import * as React from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  /** Shown in the dropdown header on mobile (e.g. "Artist filter"). */
  dropdownTitle?: string;
  className?: string;
  searchable?: boolean;
  onSearch?: (query: string) => Promise<MultiSelectOption[]>;
  loading?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onSelectionChange,
  placeholder = "Select options...",
  dropdownTitle,
  className,
  searchable = false,
  onSearch,
}: MultiSelectProps) {
  const t = useTranslations("common");
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<MultiSelectOption[]>(
    [],
  );
  const [isSearching, setIsSearching] = React.useState(false);
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [open]);

  // Store onSearch in a ref to avoid dependency issues
  const onSearchRef = React.useRef(onSearch);
  React.useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Handle search with debouncing
  React.useEffect(() => {
    if (!searchable || !onSearchRef.current || !open) {
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await onSearchRef.current!(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      // When search is empty, call onSearch with empty string to get recent/default results
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await onSearchRef.current!("");
          setSearchResults(results);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 0); // No delay for empty search to show recent tags immediately
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchable, open]);

  const handleToggle = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((s) => s !== value)
      : [...selected, value];
    onSelectionChange(newSelected);
    // Don't close on selection for multi-select
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange([]);
  };

  const selectedOptions = options.filter((opt) => selected.includes(opt.value));

  // Determine which options to display
  // When searchable and has search results (including empty query for recent tags), show search results
  // When searching with text, show search results plus any selected options that aren't in results
  // Otherwise, show static options
  let displayOptions: MultiSelectOption[];
  if (searchable && onSearch) {
    // If we have search results (from empty query or typed query), use them
    if (searchResults.length > 0 || searchQuery.trim()) {
      const selectedValues = new Set(selected);
      const searchResultValues = new Set(searchResults.map((r) => r.value));
      // Add selected options that aren't in search results
      const selectedNotInResults = options.filter(
        (opt) =>
          selectedValues.has(opt.value) && !searchResultValues.has(opt.value),
      );
      displayOptions = [...searchResults, ...selectedNotInResults];
    } else {
      // No search results yet, show static options
      displayOptions = options;
    }
  } else if (searchable && searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    displayOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(query),
    );
  } else {
    displayOptions = options;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between text-left font-normal",
            !selected.length && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex flex-1 flex-wrap gap-1 overflow-hidden">
            {selected.length === 0 ? (
              <span>{placeholder}</span>
            ) : (
              selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(option.value);
                  }}
                >
                  {option.label}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-1 inline-flex rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggle(option.value);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggle(option.value);
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <div className="flex items-center gap-1">
            {selected.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelectionChange([]);
                  }
                }}
                className="inline-flex cursor-pointer rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <div className="flex items-center justify-between border-b border-border p-2 md:hidden">
          {dropdownTitle ? (
            <span className="text-sm font-medium text-foreground">
              {dropdownTitle}
            </span>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
          >
            {t("done")}
          </Button>
        </div>
        {searchable && (
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>
        )}
        <div className="max-h-60 overflow-auto p-1">
          {isSearching ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Searching...
            </div>
          ) : displayOptions.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              {searchable && searchQuery.trim()
                ? "No results found"
                : "No options available"}
            </div>
          ) : (
            displayOptions.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                  )}
                  onClick={() => handleToggle(option.value)}
                >
                  <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary mr-2">
                    {isSelected && <Check className="h-4 w-4" />}
                  </div>
                  <span>{option.label}</span>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
