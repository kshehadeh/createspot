"use client";

import type { FormEvent } from "react";
import { useEffect, useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { useTagSearch } from "@/lib/hooks/use-tag-search";
import { useRecentTags } from "@/lib/hooks/use-recent-tags";
import { CategoryFilter } from "@/components/category-filter";

interface ExhibitionFiltersProps {
  categories: string[];
  tags: string[];
  initialCategory?: string | string[];
  initialTag?: string | string[];
  initialQuery?: string;
  exhibitId?: string;
}

export function ExhibitionFilters({
  categories,
  tags,
  initialCategory = "",
  initialTag = "",
  initialQuery = "",
  exhibitId,
}: ExhibitionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  // Normalize initialCategory to array format
  const initialCategoriesArray = Array.isArray(initialCategory)
    ? initialCategory
    : initialCategory
      ? [initialCategory]
      : [];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategoriesArray,
  );

  // Normalize initialTag to array format
  const initialTagsArray = Array.isArray(initialTag)
    ? initialTag
    : initialTag
      ? [initialTag]
      : [];
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTagsArray);
  const { addRecentTag } = useRecentTags("exhibition", undefined, exhibitId);
  const { searchTags, loading: tagSearchLoading } = useTagSearch({
    type: "exhibition",
    exhibitId,
    totalTagsCount: tags.length,
  });

  // Memoize normalized values to prevent unnecessary re-renders
  const normalizedCategories = useMemo(() => {
    return Array.isArray(initialCategory)
      ? initialCategory
      : initialCategory
        ? [initialCategory]
        : [];
  }, [
    Array.isArray(initialCategory)
      ? JSON.stringify([...initialCategory].sort())
      : initialCategory,
  ]);

  const normalizedTags = useMemo(() => {
    return Array.isArray(initialTag)
      ? initialTag
      : initialTag
        ? [initialTag]
        : [];
  }, [
    Array.isArray(initialTag)
      ? JSON.stringify([...initialTag].sort())
      : initialTag,
  ]);

  // Create stable string keys for array comparison
  const categoriesKey = useMemo(
    () => JSON.stringify([...normalizedCategories].sort()),
    [normalizedCategories],
  );
  const tagsKey = useMemo(
    () => JSON.stringify([...normalizedTags].sort()),
    [normalizedTags],
  );

  useEffect(() => {
    setSearchValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedCategories(normalizedCategories);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesKey]);

  useEffect(() => {
    setSelectedTags(normalizedTags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsKey]);

  const hasFilters = Boolean(
    selectedCategories.length > 0 || selectedTags.length > 0 || initialQuery,
  );

  const updateParams = (updates: {
    categories?: string[];
    tags?: string[];
    q?: string | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.categories !== undefined) {
      // Remove all existing category params
      params.delete("category");
      // Add new category params
      updates.categories.forEach((category) => {
        params.append("category", category);
      });
    }

    if (updates.tags !== undefined) {
      // Remove all existing tag params
      params.delete("tag");
      // Add new tag params
      updates.tags.forEach((tag) => {
        params.append("tag", tag);
      });
    }

    if (updates.q !== undefined) {
      if (updates.q) {
        params.set("q", updates.q);
      } else {
        params.delete("q");
      }
    }

    const next = params.toString();
    const basePath = pathname || "/inspire/exhibition/gallery/grid";

    startTransition(() => {
      router.replace(next ? `${basePath}?${next}` : basePath, {
        scroll: false,
      });
    });
  };

  const handleCategoriesChange = (selected: string[]) => {
    setSelectedCategories(selected);
    updateParams({ categories: selected });
  };

  const handleTagsChange = (selected: string[]) => {
    // Track newly selected tags as recent
    const previousTags = new Set(selectedTags);
    selected.forEach((tag) => {
      if (!previousTags.has(tag)) {
        addRecentTag(tag);
      }
    });

    setSelectedTags(selected);
    updateParams({ tags: selected });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ q: searchValue.trim() || null });
  };

  const handleClear = () => {
    setSearchValue("");
    setSelectedCategories([]);
    setSelectedTags([]);
    updateParams({ categories: [], tags: [], q: null });
  };

  // Create options for selected tags (to show them even if not in search results)
  const selectedTagOptions: MultiSelectOption[] = selectedTags.map((tag) => ({
    value: tag,
    label: `#${tag}`,
  }));

  return (
    <Card className="mb-8 rounded-2xl border-0 shadow-none">
      <CardContent className="px-0 py-6">
        <form onSubmit={handleSearch}>
          <div className="flex flex-col gap-3">
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
              <Button type="submit" className="rounded-xl">
                Search
              </Button>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {categories.length > 0 && (
                <div className="flex-1">
                  <CategoryFilter
                    categories={categories}
                    selected={selectedCategories}
                    onSelectionChange={handleCategoriesChange}
                    placeholder="Filter by category..."
                  />
                </div>
              )}
              <div className="flex-1">
                <MultiSelect
                  options={selectedTagOptions}
                  selected={selectedTags}
                  onSelectionChange={handleTagsChange}
                  placeholder="Filter by tags..."
                  searchable={true}
                  onSearch={searchTags}
                  loading={tagSearchLoading}
                />
              </div>
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
