"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ListFilter, SquareMousePointer } from "lucide-react";
import { CreatorHubHeaderLayout } from "@/components/creator-hub-header-layout";
import { PageSubtitle, PageTitle } from "@/components/page-title";
import { ShareButton } from "@/components/share-button";
import { PortfolioFilters } from "@/components/portfolio-filters";
import { Button, buttonVariants } from "@createspot/ui-primitives/button";
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
  userName?: string | null;
  userImage?: string | null;
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
  userName,
  userImage,
  filterProps,
  showSelectionToggle = false,
  selectionMode = false,
  onSelectionModeToggle,
}: PortfolioMobileMenuProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const t = useTranslations("portfolio");

  return (
    <div className="relative w-full">
      <CreatorHubHeaderLayout
        avatar={
          userImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userImage}
              alt={userName || "User"}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-lowest">
              <span className="text-lg font-medium text-on-surface-variant">
                {userName?.charAt(0) || "?"}
              </span>
            </div>
          )
        }
      >
          <div className="flex items-start gap-2">
            <PageTitle className="min-w-0 flex-1">{title}</PageTitle>
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
            <PageSubtitle className="mt-0">{subtitle}</PageSubtitle>
          ) : null}
      </CreatorHubHeaderLayout>

      {filtersOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setFiltersOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-outline-variant/30 bg-surface-container p-4 shadow-gallery-modal">
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
