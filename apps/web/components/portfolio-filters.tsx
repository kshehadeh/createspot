"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock, Folder, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { Button } from "@/components/ui/button";
import { useTagSearch } from "@/lib/hooks/use-tag-search";
import { useRecentTags } from "@/lib/hooks/use-recent-tags";
import { CategoryFilter } from "@/components/category-filter";

interface PortfolioFiltersProps {
  initialShareStatus?: string[];
  initialTags?: string[];
  initialCategories?: string[];
  categories?: string[];
  userId?: string;
  onFilterChange?: () => void;
  className?: string;
}

export function PortfolioFilters({
  initialShareStatus = [],
  initialTags = [],
  initialCategories = [],
  categories = [],
  userId,
  onFilterChange,
  className,
}: PortfolioFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const t = useTranslations("portfolio");
  const [selectedShareStatus, setSelectedShareStatus] =
    useState<string[]>(initialShareStatus);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategories);
  const [_isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const { addRecentTag } = useRecentTags("portfolio", userId);
  const { searchTags, loading: tagSearchLoading } = useTagSearch({
    type: "portfolio",
    userId,
  });

  // Create stable string keys for array comparison
  const shareStatusKey = useMemo(
    () => JSON.stringify([...initialShareStatus].sort()),
    [initialShareStatus],
  );
  const tagsKey = useMemo(
    () => JSON.stringify([...initialTags].sort()),
    [initialTags],
  );
  const categoriesKey = useMemo(
    () => JSON.stringify([...initialCategories].sort()),
    [initialCategories],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelectedShareStatus(initialShareStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareStatusKey]);

  useEffect(() => {
    setSelectedTags(initialTags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsKey]);

  useEffect(() => {
    setSelectedCategories(initialCategories);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesKey]);

  const hasFilters =
    selectedShareStatus.length > 0 ||
    selectedTags.length > 0 ||
    selectedCategories.length > 0;

  const updateParams = (
    shareStatus: string[],
    tags: string[],
    categories: string[],
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    // Remove all existing params
    params.delete("shareStatus");
    params.delete("tag");
    params.delete("category");

    // Add new shareStatus params
    shareStatus.forEach((status) => {
      params.append("shareStatus", status);
    });

    // Add new tag params
    tags.forEach((tag) => {
      params.append("tag", tag);
    });

    // Add new category params
    categories.forEach((category) => {
      params.append("category", category);
    });

    const next = params.toString();
    const basePath = pathname || "";

    startTransition(() => {
      router.replace(next ? `${basePath}?${next}` : basePath, {
        scroll: false,
      });
    });
  };

  const handleShareStatusChange = (selected: string[]) => {
    setSelectedShareStatus(selected);
    updateParams(selected, selectedTags, selectedCategories);
    onFilterChange?.();
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
    updateParams(selectedShareStatus, selected, selectedCategories);
    onFilterChange?.();
  };

  const handleCategoriesChange = (selected: string[]) => {
    setSelectedCategories(selected);
    updateParams(selectedShareStatus, selectedTags, selected);
    onFilterChange?.();
  };

  const handleClear = () => {
    setSelectedShareStatus([]);
    setSelectedTags([]);
    setSelectedCategories([]);
    updateParams([], [], []);
    onFilterChange?.();
  };

  const shareStatusOptions: MultiSelectOption[] = [
    {
      value: "PRIVATE",
      label: t("shareStatus.private"),
    },
    {
      value: "PROFILE",
      label: t("shareStatus.profile"),
    },
    {
      value: "PUBLIC",
      label: t("shareStatus.public"),
    },
  ];

  // Create options for selected tags (to show them even if not in search results)
  const selectedTagOptions: MultiSelectOption[] = selectedTags.map((tag) => ({
    value: tag,
    label: tag,
  }));

  if (!mounted) {
    return null;
  }

  return (
    <Card className={cn("mb-6 rounded-2xl border-0 shadow-none", className)}>
      <CardContent className="px-0 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <MultiSelect
                options={shareStatusOptions}
                selected={selectedShareStatus}
                onSelectionChange={handleShareStatusChange}
                placeholder={t("filterByAccessLevel")}
                startIcon={<Lock className="h-4 w-4" />}
              />
            </div>
            {categories.length > 0 && (
              <div className="flex-1">
                <CategoryFilter
                  categories={categories}
                  selected={selectedCategories}
                  onSelectionChange={handleCategoriesChange}
                  placeholder="Filter by category..."
                  startIcon={<Folder className="h-4 w-4" />}
                />
              </div>
            )}
            {userId && (
              <div className="flex-1">
                <MultiSelect
                  options={selectedTagOptions}
                  selected={selectedTags}
                  onSelectionChange={handleTagsChange}
                  placeholder={t("filterByTags")}
                  searchable={true}
                  onSearch={searchTags}
                  loading={tagSearchLoading}
                  startIcon={<Tag className="h-4 w-4" />}
                />
              </div>
            )}
            {hasFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="rounded-xl"
              >
                {t("clearFilters")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
