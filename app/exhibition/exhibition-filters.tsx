"use client";

import type { FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ExhibitionFiltersProps {
  categories: string[];
  tags: string[];
  initialCategory?: string;
  initialTag?: string;
  initialQuery?: string;
}

export function ExhibitionFilters({
  categories,
  tags,
  initialCategory = "",
  initialTag = "",
  initialQuery = "",
}: ExhibitionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    setSearchValue(initialQuery);
  }, [initialQuery]);

  const hasFilters = Boolean(initialCategory || initialTag || initialQuery);

  const updateParams = (updates: {
    category?: string | null;
    tag?: string | null;
    q?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.category !== undefined) {
      if (updates.category) {
        params.set("category", updates.category);
      } else {
        params.delete("category");
      }
    }

    if (updates.tag !== undefined) {
      if (updates.tag) {
        params.set("tag", updates.tag);
      } else {
        params.delete("tag");
      }
    }

    if (updates.q !== undefined) {
      if (updates.q) {
        params.set("q", updates.q);
      } else {
        params.delete("q");
      }
    }

    const next = params.toString();
    const basePath = pathname || "/exhibition/gallery";

    startTransition(() => {
      router.replace(next ? `${basePath}?${next}` : basePath, {
        scroll: false,
      });
    });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ q: searchValue.trim() || null });
  };

  const handleClear = () => {
    setSearchValue("");
    updateParams({ category: null, tag: null, q: null });
  };

  const activeFiltersCount = (initialCategory ? 1 : 0) + (initialTag ? 1 : 0);

  return (
    <Card className="mb-8 rounded-2xl border-0 shadow-none">
      <CardContent className="p-6">
        <form onSubmit={handleSearch}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="h-10 w-full rounded-xl pl-10 pr-10 shadow-inner"
                placeholder="Search titles, tags, prompt words, or keywords"
              />
              {isPending && (
                <div className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="rounded-xl">
                Search
              </Button>
              <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`rounded-xl gap-2 ${
                      activeFiltersCount > 0
                        ? "border-[hsl(var(--filter-active))] bg-[hsl(var(--filter-active-background))] text-[hsl(var(--filter-active-foreground))] hover:bg-[hsl(var(--filter-active-hover))]"
                        : ""
                    }`}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      />
                    </svg>
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-1 bg-[hsl(var(--filter-active))] text-[hsl(var(--filter-active-foreground))]">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 rounded-xl p-4" align="end">
                  <div className="max-h-96 space-y-6 overflow-y-auto">
                    {categories.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-popover-foreground">
                          Categories
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <FilterPill
                            label="All"
                            isActive={!initialCategory}
                            onClick={() => {
                              updateParams({ category: null });
                            }}
                          />
                          {categories.map((categoryName) => (
                            <FilterPill
                              key={categoryName}
                              label={categoryName}
                              isActive={initialCategory === categoryName}
                              onClick={() => {
                                updateParams({
                                  category:
                                    initialCategory === categoryName
                                      ? null
                                      : categoryName,
                                });
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {tags.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-popover-foreground">
                            Tags
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Tap to focus
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tagName) => (
                            <FilterPill
                              key={tagName}
                              label={`#${tagName}`}
                              isActive={initialTag === tagName}
                              onClick={() => {
                                updateParams({
                                  tag: initialTag === tagName ? null : tagName,
                                });
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {categories.length === 0 && tags.length === 0 && (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        No filters available
                      </div>
                    )}
                  </div>

                  {hasFilters && (
                    <div className="mt-4 border-t border-border pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          handleClear();
                          setIsFiltersOpen(false);
                        }}
                        className="w-full rounded-lg"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              {hasFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="rounded-xl"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FilterPill({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {label}
    </button>
  );
}
