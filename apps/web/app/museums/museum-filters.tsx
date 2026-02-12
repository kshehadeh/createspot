"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  initialArtists?: string[];
  initialMediums?: string[];
  initialGenres?: string[];
  initialDateStart?: number;
  initialDateEnd?: number;
  /** When true, renders without Card wrapper (e.g. inside a bottom sheet). */
  embedded?: boolean;
}

export function MuseumFilters({
  facets,
  initialQuery = "",
  initialMuseums = [],
  initialArtists = [],
  initialMediums = [],
  initialGenres = [],
  initialDateStart,
  initialDateEnd,
  embedded = false,
}: MuseumFiltersProps) {
  const t = useTranslations("museums.filters");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [selectedMuseums, setSelectedMuseums] =
    useState<string[]>(initialMuseums);
  const [selectedArtists, setSelectedArtists] =
    useState<string[]>(initialArtists);
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
    setSelectedArtists(initialArtists);
  }, [initialArtists.join(",")]);

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
      selectedArtists.length > 0 ||
      selectedMediums.length > 0 ||
      selectedGenres.length > 0 ||
      dateStartValue.trim() ||
      dateEndValue.trim(),
  );

  const updateParams = (updates: {
    q?: string | null;
    museums?: string[];
    artists?: string[];
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
    if (updates.artists !== undefined) {
      params.delete("artist");
      updates.artists.forEach((a) => params.append("artist", a));
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
    setSelectedArtists([]);
    setSelectedMediums([]);
    setSelectedGenres([]);
    setDateStartValue("");
    setDateEndValue("");
    updateParams({
      q: null,
      museums: [],
      artists: [],
      mediums: [],
      genres: [],
      dateStart: null,
      dateEnd: null,
    });
  };

  const searchArtists = useCallback(
    async (query: string): Promise<MultiSelectOption[]> => {
      const res = await fetch(
        `/api/museums/artists?q=${encodeURIComponent(query)}`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.artists || []).map(
        (a: { value: string; label: string }) => ({
          value: a.value,
          label: a.label,
        }),
      );
    },
    [],
  );

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

  const formContent = (
    <form onSubmit={handleSearch} className="flex flex-col gap-4">
      {/* Keyword search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          {t("searchPlaceholder")}
        </Label>
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
            className="h-9 w-full rounded-lg pl-9 pr-9"
            placeholder={t("searchPlaceholder")}
          />
          {isPending && (
            <div className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            </div>
          )}
        </div>
        <Button type="submit" size="sm" className="w-full rounded-lg">
          {t("search")}
        </Button>
      </div>

      {/* Museum */}
      {museumOptions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            {t("museumPlaceholder")}
          </Label>
          <MultiSelect
            options={museumOptions}
            selected={selectedMuseums}
            onSelectionChange={(selected) => {
              setSelectedMuseums(selected);
              updateParams({ museums: selected });
            }}
            placeholder={t("museumPlaceholder")}
            dropdownTitle={t("museumFilterTitle")}
            className="w-full"
          />
        </div>
      )}

      {/* Artist */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          {t("artistPlaceholder")}
        </Label>
        <MultiSelect
          options={selectedArtists.map((name) => ({
            value: name,
            label: name,
          }))}
          selected={selectedArtists}
          onSelectionChange={(selected) => {
            setSelectedArtists(selected);
            updateParams({ artists: selected });
          }}
          placeholder={t("artistPlaceholder")}
          dropdownTitle={t("artistFilterTitle")}
          searchable
          onSearch={searchArtists}
          className="w-full"
        />
      </div>

      {/* Medium */}
      {mediumOptions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            {t("mediumPlaceholder")}
          </Label>
          <MultiSelect
            options={mediumOptions}
            selected={selectedMediums}
            onSelectionChange={(selected) => {
              setSelectedMediums(selected);
              updateParams({ mediums: selected });
            }}
            placeholder={t("mediumPlaceholder")}
            dropdownTitle={t("mediumFilterTitle")}
            searchable
            className="w-full"
          />
        </div>
      )}

      {/* Style / genre */}
      {styleOptions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            {t("stylePlaceholder")}
          </Label>
          <MultiSelect
            options={styleOptions}
            selected={selectedGenres}
            onSelectionChange={(selected) => {
              setSelectedGenres(selected);
              updateParams({ genres: selected });
            }}
            placeholder={t("stylePlaceholder")}
            dropdownTitle={t("styleFilterTitle")}
            searchable
            className="w-full"
          />
        </div>
      )}

      {/* Date range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          {t("dateStartPlaceholder")} – {t("dateEndPlaceholder")}
        </Label>
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
            className="h-9 flex-1 rounded-lg"
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
            className="h-9 flex-1 rounded-lg"
            min={0}
            max={2100}
          />
        </div>
      </div>

      {hasFilters && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          className="w-full rounded-lg"
        >
          {t("clear")}
        </Button>
      )}
    </form>
  );

  if (embedded) {
    return <div className="p-0">{formContent}</div>;
  }

  return (
    <Card className="rounded-2xl border-0 shadow-none">
      <CardContent className="p-4">{formContent}</CardContent>
    </Card>
  );
}
