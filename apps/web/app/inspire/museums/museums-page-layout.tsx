"use client";

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
    </>
  );
}
