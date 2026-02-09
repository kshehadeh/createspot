import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { MUSEUM_PAGE_SIZE } from "@/lib/museums/constants";
import { getMuseumArtworks, getMuseumFacets } from "@/lib/museums/queries";
import { MuseumFilters } from "./museum-filters";
import { MuseumGrid } from "./museum-grid";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("museums.page");
  const title = `${t("title")} | Create Spot`;
  const description = t("description");
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

interface MuseumsPageProps {
  searchParams: Promise<{
    q?: string;
    museum?: string | string[];
    medium?: string | string[];
    genre?: string | string[];
    dateStart?: string;
    dateEnd?: string;
  }>;
}

function normalizeArrayParam(value: string | string[] | undefined): string[] {
  if (value == null) return [];
  const arr = Array.isArray(value) ? value : [value];
  return arr.map((v) => v?.trim()).filter(Boolean);
}

function parseIntParam(value: string | undefined): number | undefined {
  if (value == null) return undefined;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

export default async function MuseumsPage({ searchParams }: MuseumsPageProps) {
  const params = await searchParams;
  const t = await getTranslations("museums.page");

  const q = params.q?.trim() || undefined;
  const museums = normalizeArrayParam(params.museum);
  const mediums = normalizeArrayParam(params.medium);
  const genres = normalizeArrayParam(params.genre);
  const dateStart = parseIntParam(params.dateStart);
  const dateEnd = parseIntParam(params.dateEnd);

  const [result, facets] = await Promise.all([
    getMuseumArtworks({
      q,
      museums: museums.length > 0 ? museums : undefined,
      mediums: mediums.length > 0 ? mediums : undefined,
      genres: genres.length > 0 ? genres : undefined,
      dateStart,
      dateEnd,
      skip: 0,
      take: MUSEUM_PAGE_SIZE,
    }),
    getMuseumFacets(),
  ]);

  return (
    <PageLayout maxWidth="max-w-none" className="w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>

      <MuseumFilters
        facets={facets}
        initialQuery={q ?? ""}
        initialMuseums={museums}
        initialMediums={mediums}
        initialGenres={genres}
        initialDateStart={dateStart}
        initialDateEnd={dateEnd}
      />

      <MuseumGrid
        initialArtworks={result.artworks}
        initialHasMore={result.hasMore}
      />
    </PageLayout>
  );
}
