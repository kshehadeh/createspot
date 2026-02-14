"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronUp, SlidersHorizontal } from "lucide-react";
import { MuseumFilters, type MuseumFacetsData } from "./museum-filters";
import { MuseumGrid, type MuseumArtworkItem } from "./museum-grid";

interface MuseumsPageLayoutProps {
  facets: MuseumFacetsData;
  initialQuery: string;
  initialMuseums: string[];
  initialArtists: string[];
  initialMediums: string[];
  initialGenres: string[];
  initialDateStart: number | undefined;
  initialDateEnd: number | undefined;
  initialArtworks: MuseumArtworkItem[];
  initialHasMore: boolean;
}

export function MuseumsPageLayout({
  facets,
  initialQuery,
  initialMuseums,
  initialArtists,
  initialMediums,
  initialGenres,
  initialDateStart,
  initialDateEnd,
  initialArtworks,
  initialHasMore,
}: MuseumsPageLayoutProps) {
  const t = useTranslations("museums.filters");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const filterProps = {
    facets,
    initialQuery,
    initialMuseums,
    initialArtists,
    initialMediums,
    initialGenres,
    initialDateStart,
    initialDateEnd,
  };

  return (
    <>
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start pb-16 lg:pb-0">
        {/* Desktop: left sidebar */}
        <aside className="hidden w-full shrink-0 lg:block lg:w-72 lg:sticky lg:top-6">
          <MuseumFilters {...filterProps} />
        </aside>

        {/* Main content: grid */}
        <div className="min-w-0 flex-1">
          <MuseumGrid
            initialArtworks={initialArtworks}
            initialHasMore={initialHasMore}
          />
        </div>
      </div>

      {/* Mobile: filters bar (same pattern as about MobileNavBar) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        {isMobileFiltersOpen && (
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setIsMobileFiltersOpen(false)}
            aria-hidden
          />
        )}
        <div className="relative border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          {isMobileFiltersOpen ? (
            <>
              <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {t("title")}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-accent"
                  aria-label={t("closeLabel")}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="max-h-[85vh] overflow-y-auto px-4 py-4">
                <MuseumFilters {...filterProps} embedded />
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className="flex w-full min-h-[4.5rem] items-center justify-center gap-2 px-4 py-5 text-sm font-medium text-foreground"
              aria-expanded={isMobileFiltersOpen}
              aria-label={t("expandLabel")}
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" />
              <span className="truncate">{t("title")}</span>
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
