"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ListFilter, SquareMousePointer } from "lucide-react";
import { ShareButton } from "@/components/share-button";
import { PortfolioFilters } from "@/components/portfolio-filters";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PortfolioSortValue } from "@/lib/portfolio-page-query";

export interface PortfolioMobileFilterProps {
  initialShareStatus: string[];
  initialTags: string[];
  initialCategories: string[];
  initialQ: string;
  initialSort: PortfolioSortValue;
  categories: string[];
  userId: string;
  showShareStatusFilter: boolean;
}

interface PortfolioMobileMenuProps {
  title: string;
  /** Shown below the title row (e.g. work count). */
  subtitle?: string;
  userId: string;
  filterProps: PortfolioMobileFilterProps;
  /** Owner-only: show icon-only select-items toggle beside the filter control. */
  showSelectionToggle?: boolean;
  selectionMode?: boolean;
  onSelectionModeToggle?: () => void;
}

export function PortfolioMobileMenu({
  title,
  subtitle,
  userId,
  filterProps,
  showSelectionToggle = false,
  selectionMode = false,
  onSelectionModeToggle,
}: PortfolioMobileMenuProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const t = useTranslations("portfolio");

  return (
    <div className="relative w-full">
      <div className="flex items-start gap-2">
        <h1 className="min-w-0 flex-1 break-words text-2xl font-bold text-foreground sm:text-3xl">
          {title}
        </h1>
        <div className="flex shrink-0 items-center gap-1 pt-0.5">
          <ShareButton
            type="portfolio"
            userId={userId}
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "shrink-0",
            )}
          />
          {showSelectionToggle && onSelectionModeToggle && (
            <Button
              type="button"
              variant={selectionMode ? "secondary" : "outline"}
              size="icon"
              className="h-10 w-10 shrink-0"
              aria-label={
                selectionMode ? t("exitSelectionMode") : t("selectionMode")
              }
              aria-pressed={selectionMode}
              onClick={onSelectionModeToggle}
            >
              <SquareMousePointer className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
            aria-expanded={filtersOpen}
            aria-label={t("openPortfolioFilters")}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <ListFilter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {subtitle ? (
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      ) : null}

      {filtersOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setFiltersOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-none border border-border bg-background p-4 shadow-lg">
            <PortfolioFilters
              {...filterProps}
              onFilterChange={() => setFiltersOpen(false)}
              className="mb-0"
            />
          </div>
        </>
      )}
    </div>
  );
}
