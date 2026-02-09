"use client";

import type { FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { getMuseumDisplayName } from "@/lib/museums/museum-display-names";

export interface MuseumFacetsData {
  museumIds: string[];
  mediums: string[];
  genres: string[];
  classifications: string[];
}

interface MuseumFiltersProps {
  facets: MuseumFacetsData;
  initialQuery?: string;
  initialMuseums?: string[];
  initialMediums?: string[];
  initialGenres?: string[];
  initialDateStart?: number;
  initialDateEnd?: number;
}

export function MuseumFilters({
  facets,
  initialQuery = "",
  initialMuseums = [],
  initialMediums = [],
  initialGenres = [],
  initialDateStart,
  initialDateEnd,
}: MuseumFiltersProps) {
  const t = useTranslations("museums.filters");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [selectedMuseums, setSelectedMuseums] =
    useState<string[]>(initialMuseums);
  const [selectedMediums, setSelectedMediums] =
    useState<string[]>(initialMediums);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres);
  const [dateStartValue, setDateStartValue] = useState(
    initialDateStart != null ? String(initialDateStart) : "",
  );
  const [dateEndValue, setDateEndValue] = useState(
    initialDateEnd != null ? String(initialDateEnd) : "",
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSearchValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedMuseums(initialMuseums);
  }, [initialMuseums.join(",")]);

  useEffect(() => {
    setSelectedMediums(initialMediums);
  }, [initialMediums.join(",")]);

  useEffect(() => {
    setSelectedGenres(initialGenres);
  }, [initialGenres.join(",")]);

  useEffect(() => {
    setDateStartValue(initialDateStart != null ? String(initialDateStart) : "");
  }, [initialDateStart]);

  useEffect(() => {
    setDateEndValue(initialDateEnd != null ? String(initialDateEnd) : "");
  }, [initialDateEnd]);

  const hasFilters = Boolean(
    searchValue.trim() ||
      selectedMuseums.length > 0 ||
      selectedMediums.length > 0 ||
      selectedGenres.length > 0 ||
      dateStartValue.trim() ||
      dateEndValue.trim(),
  );

  const updateParams = (updates: {
    q?: string | null;
    museums?: string[];
    mediums?: string[];
    genres?: string[];
    dateStart?: number | null;
    dateEnd?: number | null;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.q !== undefined) {
      if (updates.q) params.set("q", updates.q);
      else params.delete("q");
    }
    if (updates.museums !== undefined) {
      params.delete("museum");
      updates.museums.forEach((m) => params.append("museum", m));
    }
    if (updates.mediums !== undefined) {
      params.delete("medium");
      updates.mediums.forEach((m) => params.append("medium", m));
    }
    if (updates.genres !== undefined) {
      params.delete("genre");
      updates.genres.forEach((g) => params.append("genre", g));
    }
    if (updates.dateStart !== undefined) {
      if (updates.dateStart != null && Number.isFinite(updates.dateStart)) {
        params.set("dateStart", String(updates.dateStart));
      } else {
        params.delete("dateStart");
      }
    }
    if (updates.dateEnd !== undefined) {
      if (updates.dateEnd != null && Number.isFinite(updates.dateEnd)) {
        params.set("dateEnd", String(updates.dateEnd));
      } else {
        params.delete("dateEnd");
      }
    }

    const next = params.toString();
    const basePath = pathname ?? "/museums";

    startTransition(() => {
      router.replace(next ? `${basePath}?${next}` : basePath, {
        scroll: false,
      });
    });
  };

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateParams({ q: searchValue.trim() || null });
  };

  const handleClear = () => {
    setSearchValue("");
    setSelectedMuseums([]);
    setSelectedMediums([]);
    setSelectedGenres([]);
    setDateStartValue("");
    setDateEndValue("");
    updateParams({
      q: null,
      museums: [],
      mediums: [],
      genres: [],
      dateStart: null,
      dateEnd: null,
    });
  };

  const museumOptions: MultiSelectOption[] = facets.museumIds.map((id) => ({
    value: id,
    label: getMuseumDisplayName(id),
  }));

  const mediumOptions: MultiSelectOption[] = facets.mediums.map((m) => ({
    value: m,
    label: m,
  }));

  const styleOptions: MultiSelectOption[] = [
    ...new Set([...facets.genres, ...facets.classifications]),
  ]
    .sort((a, b) => a.localeCompare(b))
    .map((s) => ({ value: s, label: s }));

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
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="h-10 w-full rounded-xl pl-10 pr-10 shadow-inner"
                  placeholder={t("searchPlaceholder")}
                />
                {isPending && (
                  <div className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                  </div>
                )}
              </div>
              <Button type="submit" className="rounded-xl">
                {t("search")}
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {museumOptions.length > 0 && (
                <div className="min-w-[180px] flex-1">
                  <MultiSelect
                    options={museumOptions}
                    selected={selectedMuseums}
                    onSelectionChange={(selected) => {
                      setSelectedMuseums(selected);
                      updateParams({ museums: selected });
                    }}
                    placeholder={t("museumPlaceholder")}
                  />
                </div>
              )}
              {mediumOptions.length > 0 && (
                <div className="min-w-[180px] flex-1">
                  <MultiSelect
                    options={mediumOptions}
                    selected={selectedMediums}
                    onSelectionChange={(selected) => {
                      setSelectedMediums(selected);
                      updateParams({ mediums: selected });
                    }}
                    placeholder={t("mediumPlaceholder")}
                    searchable
                  />
                </div>
              )}
              {styleOptions.length > 0 && (
                <div className="min-w-[180px] flex-1">
                  <MultiSelect
                    options={styleOptions}
                    selected={selectedGenres}
                    onSelectionChange={(selected) => {
                      setSelectedGenres(selected);
                      updateParams({ genres: selected });
                    }}
                    placeholder={t("stylePlaceholder")}
                    searchable
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder={t("dateStartPlaceholder")}
                  value={dateStartValue}
                  onChange={(e) => {
                    setDateStartValue(e.target.value);
                    const n = parseInt(e.target.value, 10);
                    updateParams({
                      dateStart: Number.isFinite(n) ? n : null,
                    });
                  }}
                  className="h-10 w-24 rounded-xl shadow-inner"
                  min={0}
                  max={2100}
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="number"
                  placeholder={t("dateEndPlaceholder")}
                  value={dateEndValue}
                  onChange={(e) => {
                    setDateEndValue(e.target.value);
                    const n = parseInt(e.target.value, 10);
                    updateParams({
                      dateEnd: Number.isFinite(n) ? n : null,
                    });
                  }}
                  className="h-10 w-24 rounded-xl shadow-inner"
                  min={0}
                  max={2100}
                />
              </div>
              {hasFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="rounded-xl"
                >
                  {t("clear")}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
