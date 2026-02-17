"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Calendar,
  Landmark,
  Paintbrush,
  Palette,
  Search,
  UserCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { getMuseumDisplayName } from "@/lib/museums/museum-display-names";

const filterIconClass = "h-4 w-4 shrink-0 text-muted-foreground";

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
  /** Called when filters are applied (e.g. to close mobile dropdown). */
  onFilterChange?: () => void;
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
  onFilterChange,
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
    const basePath = pathname ?? "/inspire/museums";

    startTransition(() => {
      router.replace(next ? `${basePath}?${next}` : basePath, {
        scroll: false,
      });
    });
    onFilterChange?.();
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
      <div className="relative">
        <Input
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="h-9 w-full rounded-lg pr-10"
          placeholder={t("searchPlaceholder")}
        />
        {isPending ? (
          <div className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          </div>
        ) : (
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md"
            aria-label={t("search")}
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Artist */}
      <div className="flex items-center gap-2">
        <UserCircle className={filterIconClass} aria-hidden />
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
          className="min-w-0 flex-1"
        />
      </div>

      {/* Medium */}
      {mediumOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <Paintbrush className={filterIconClass} aria-hidden />
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
            className="min-w-0 flex-1"
          />
        </div>
      )}

      {/* Style / genre */}
      {styleOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <Palette className={filterIconClass} aria-hidden />
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
            className="min-w-0 flex-1"
          />
        </div>
      )}

      {/* Date range */}
      <div className="flex items-center gap-2">
        <Calendar className={filterIconClass} aria-hidden />
        <div className="flex min-w-0 flex-1 items-center gap-2">
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
          <span className="shrink-0 text-muted-foreground">–</span>
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

      {/* Museum */}
      {museumOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <Landmark className={filterIconClass} aria-hidden />
          <MultiSelect
            options={museumOptions}
            selected={selectedMuseums}
            onSelectionChange={(selected) => {
              setSelectedMuseums(selected);
              updateParams({ museums: selected });
            }}
            placeholder={t("museumPlaceholder")}
            dropdownTitle={t("museumFilterTitle")}
            className="min-w-0 flex-1"
          />
        </div>
      )}

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
