"use client";

import { useEffect, useState, useTransition, useMemo, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Lock, Folder, Tag, Search, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { Button } from "@createspot/ui-primitives/button";
import { Input } from "@createspot/ui-primitives/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@createspot/ui-primitives/select";
import { useTagSearch } from "@/lib/hooks/use-tag-search";
import { useRecentTags } from "@/lib/hooks/use-recent-tags";
import { CategoryFilter } from "@/components/category-filter";
import type { PortfolioSortValue } from "@/lib/portfolio-page-query";
import { PORTFOLIO_SORT_VALUES } from "@/lib/portfolio-page-query";

interface PortfolioFiltersProps {
  initialShareStatus?: string[];
  initialTags?: string[];
  initialCategories?: string[];
  initialQ?: string;
  initialSort?: PortfolioSortValue;
  categories?: string[];
  userId?: string;
  /** When false, hide share-status filter (e.g. visitors). */
  showShareStatusFilter?: boolean;
  onFilterChange?: () => void;
  className?: string;
}

export function PortfolioFilters({
  initialShareStatus = [],
  initialTags = [],
  initialCategories = [],
  initialQ = "",
  initialSort = "order",
  categories = [],
  userId,
  showShareStatusFilter = true,
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
  const [qInput, setQInput] = useState(initialQ);
  const [sortValue, setSortValue] = useState<PortfolioSortValue>(initialSort);
  const [_isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addRecentTag } = useRecentTags("portfolio", userId);
  const { searchTags, loading: tagSearchLoading } = useTagSearch({
    type: "portfolio",
    userId,
  });

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
  const qKey = initialQ;
  const sortKey = initialSort;

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

  useEffect(() => {
    setQInput(initialQ);
  }, [qKey]);

  useEffect(() => {
    setSortValue(initialSort);
  }, [sortKey]);

  const hasFilters =
    (showShareStatusFilter && selectedShareStatus.length > 0) ||
    selectedTags.length > 0 ||
    selectedCategories.length > 0 ||
    qInput.trim().length > 0 ||
    sortValue !== "order";

  const pushParams = (
    shareStatus: string[],
    tags: string[],
    categoriesSel: string[],
    q: string,
    sort: PortfolioSortValue,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("shareStatus");
    params.delete("tag");
    params.delete("category");
    params.delete("q");
    params.delete("sort");

    shareStatus.forEach((status) => params.append("shareStatus", status));
    tags.forEach((tag) => params.append("tag", tag));
    categoriesSel.forEach((category) => params.append("category", category));

    const qt = q.trim();
    if (qt) {
      params.set("q", qt);
    }
    if (sort !== "order") {
      params.set("sort", sort);
    }

    const next = params.toString();
    const basePath = pathname || "";

    startTransition(() => {
      router.replace(next ? `${basePath}?${next}` : basePath, {
        scroll: false,
      });
    });
  };

  const scheduleQUpdate = (nextQ: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      pushParams(
        selectedShareStatus,
        selectedTags,
        selectedCategories,
        nextQ,
        sortValue,
      );
      debounceRef.current = null;
    }, 350);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleShareStatusChange = (selected: string[]) => {
    setSelectedShareStatus(selected);
    pushParams(selected, selectedTags, selectedCategories, qInput, sortValue);
    onFilterChange?.();
  };

  const handleTagsChange = (selected: string[]) => {
    const previousTags = new Set(selectedTags);
    selected.forEach((tag) => {
      if (!previousTags.has(tag)) {
        addRecentTag(tag);
      }
    });

    setSelectedTags(selected);
    pushParams(
      selectedShareStatus,
      selected,
      selectedCategories,
      qInput,
      sortValue,
    );
    onFilterChange?.();
  };

  const handleCategoriesChange = (selected: string[]) => {
    setSelectedCategories(selected);
    pushParams(selectedShareStatus, selectedTags, selected, qInput, sortValue);
    onFilterChange?.();
  };

  const handleQChange = (value: string) => {
    setQInput(value);
    scheduleQUpdate(value);
  };

  const handleSortChange = (value: string) => {
    const s = (PORTFOLIO_SORT_VALUES as readonly string[]).includes(value)
      ? (value as PortfolioSortValue)
      : "order";
    setSortValue(s);
    pushParams(
      selectedShareStatus,
      selectedTags,
      selectedCategories,
      qInput,
      s,
    );
    onFilterChange?.();
  };

  const handleClear = () => {
    setSelectedShareStatus([]);
    setSelectedTags([]);
    setSelectedCategories([]);
    setQInput("");
    setSortValue("order");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    pushParams([], [], [], "", "order");
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
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <div className="flex min-w-[min(100%,12rem)] flex-1 items-center gap-2 rounded-xl border border-input bg-background px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                type="search"
                value={qInput}
                onChange={(e) => handleQChange(e.target.value)}
                placeholder={t("searchPortfolioPlaceholder")}
                className="h-10 min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 py-2 shadow-none outline-none ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <div className="flex min-w-[min(100%,11rem)] items-center gap-2 md:w-44">
              <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Select value={sortValue} onValueChange={handleSortChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={t("sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">{t("sortOrder")}</SelectItem>
                  <SelectItem value="newest">{t("sortNewest")}</SelectItem>
                  <SelectItem value="oldest">{t("sortOldest")}</SelectItem>
                  <SelectItem value="title">{t("sortTitle")}</SelectItem>
                  <SelectItem value="favorites">
                    {t("sortFavorites")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {showShareStatusFilter && (
              <div className="min-w-[min(100%,14rem)] flex-1">
                <MultiSelect
                  options={shareStatusOptions}
                  selected={selectedShareStatus}
                  onSelectionChange={handleShareStatusChange}
                  placeholder={t("filterByAccessLevel")}
                  startIcon={<Lock className="h-4 w-4" />}
                />
              </div>
            )}
            {categories.length > 0 && (
              <div className="min-w-[min(100%,14rem)] flex-1">
                <CategoryFilter
                  categories={categories}
                  selected={selectedCategories}
                  onSelectionChange={handleCategoriesChange}
                  placeholder={t("filterByCategory")}
                  startIcon={<Folder className="h-4 w-4" />}
                />
              </div>
            )}
            {userId && (
              <div className="min-w-[min(100%,14rem)] flex-1">
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
