"use client";

import { useState } from "react";
import { MobileTitleDropdown } from "@/components/mobile-title-dropdown";
import { MuseumFilters, type MuseumFacetsData } from "./museum-filters";

interface MuseumsMobileMenuFilterProps {
  facets: MuseumFacetsData;
  initialQuery: string;
  initialMuseums: string[];
  initialArtists: string[];
  initialMediums: string[];
  initialGenres: string[];
  initialDateStart: number | undefined;
  initialDateEnd: number | undefined;
}

interface MuseumsMobileMenuProps {
  title: string;
  filterProps: MuseumsMobileMenuFilterProps;
}

export function MuseumsMobileMenu({
  title,
  filterProps,
}: MuseumsMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MobileTitleDropdown open={isOpen} onOpenChange={setIsOpen} title={title}>
      <div className="max-h-[85vh] overflow-y-auto">
        <MuseumFilters
          {...filterProps}
          embedded
          onFilterChange={() => setIsOpen(false)}
        />
      </div>
    </MobileTitleDropdown>
  );
}
