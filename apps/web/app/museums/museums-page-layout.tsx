"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start pb-20 lg:pb-0">
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

      {/* Mobile: overlay when filters open */}
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity duration-300 lg:hidden ${
          isMobileFiltersOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileFiltersOpen(false)}
        aria-hidden
      />

      {/* Mobile: bottom sheet with filters (same pattern as admin prompts) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div
          className={`flex flex-col overflow-hidden border-t border-border bg-card shadow-2xl transition-all duration-200 ease-out ${
            isMobileFiltersOpen ? "max-h-[85vh]" : "max-h-20"
          }`}
        >
          {/* Collapsed bar / header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            {!isMobileFiltersOpen ? (
              <>
                <h3 className="text-sm font-semibold text-foreground">
                  {t("title")}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="p-2 text-muted-foreground"
                  aria-label={t("expandLabel")}
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
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Expanded content: same filter component as sidebar */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <MuseumFilters {...filterProps} embedded />
          </div>
        </div>
      </div>
    </>
  );
}
