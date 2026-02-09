import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { MuseumArtworkListItem } from "./types";
import { MUSEUM_PAGE_SIZE } from "./constants";
const FACETS_ARRAY_LIMIT = 500;
const FACETS_TOP_N = 50;

export interface MuseumArtworkFilters {
  q?: string;
  museums?: string[];
  artists?: string[];
  mediums?: string[];
  genres?: string[];
  dateStart?: number;
  dateEnd?: number;
  skip?: number;
  take?: number;
}

export interface MuseumArtworksResult {
  artworks: MuseumArtworkListItem[];
  hasMore: boolean;
}

export async function getMuseumArtworks(
  filters: MuseumArtworkFilters,
): Promise<MuseumArtworksResult> {
  const skip = Math.max(filters.skip ?? 0, 0);
  const take = Math.min(
    Math.max(filters.take ?? MUSEUM_PAGE_SIZE, 1),
    MUSEUM_PAGE_SIZE * 2,
  );

  const and: Prisma.MuseumArtworkWhereInput[] = [];

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (filters.museums?.length) {
    and.push({ museumId: { in: filters.museums } });
  }

  if (filters.artists?.length) {
    const artistIds = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "MuseumArtwork"
      WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(artists) AS elem
        WHERE elem->>'name' = ANY(${filters.artists}::text[])
      )
    `;
    const ids = artistIds.map((r) => r.id);
    if (ids.length > 0) {
      and.push({ id: { in: ids } });
    } else {
      // No artworks match the selected artists; return empty result
      and.push({ id: { in: [] } });
    }
  }

  if (filters.mediums?.length) {
    and.push({ mediums: { hasSome: filters.mediums } });
  }

  if (filters.genres?.length) {
    and.push({
      OR: [
        { genres: { hasSome: filters.genres } },
        { classifications: { hasSome: filters.genres } },
      ],
    });
  }

  if (filters.dateStart != null && Number.isFinite(filters.dateStart)) {
    and.push({ dateEnd: { gte: filters.dateStart } });
  }
  if (filters.dateEnd != null && Number.isFinite(filters.dateEnd)) {
    and.push({ dateStart: { lte: filters.dateEnd } });
  }

  const where: Prisma.MuseumArtworkWhereInput =
    and.length > 0 ? { AND: and } : {};

  const artworks = await prisma.museumArtwork.findMany({
    where,
    orderBy: { curatedAt: "desc" },
    skip,
    take: take + 1,
    select: {
      id: true,
      globalId: true,
      localId: true,
      museumId: true,
      title: true,
      description: true,
      artists: true,
      imageUrl: true,
      thumbnailUrl: true,
      additionalImages: true,
      mediums: true,
      mediumDisplay: true,
      genres: true,
      classifications: true,
      tags: true,
      dateCreated: true,
      dateStart: true,
      dateEnd: true,
      dimensions: true,
      department: true,
      culture: true,
      creditLine: true,
      sourceUrl: true,
    },
  });

  const hasMore = artworks.length > take;
  const slice = hasMore ? artworks.slice(0, take) : artworks;

  return {
    artworks: slice,
    hasMore,
  };
}

export interface MuseumFacets {
  museumIds: string[];
  mediums: string[];
  genres: string[];
  classifications: string[];
}

export async function getMuseumFacets(): Promise<MuseumFacets> {
  const [museumGroups, sample] = await Promise.all([
    prisma.museumArtwork.groupBy({
      by: ["museumId"],
      _count: { museumId: true },
      orderBy: { _count: { museumId: "desc" } },
    }),
    prisma.museumArtwork.findMany({
      select: {
        mediums: true,
        genres: true,
        classifications: true,
      },
      take: FACETS_ARRAY_LIMIT,
    }),
  ]);

  const museumIds = museumGroups.map((g) => g.museumId);

  const mediumCount = new Map<string, number>();
  const genreCount = new Map<string, number>();
  const classificationCount = new Map<string, number>();

  for (const row of sample) {
    for (const m of row.mediums) {
      mediumCount.set(m, (mediumCount.get(m) ?? 0) + 1);
    }
    for (const g of row.genres) {
      genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
    }
    for (const c of row.classifications) {
      classificationCount.set(c, (classificationCount.get(c) ?? 0) + 1);
    }
  }

  const sortByCount = (a: [string, number], b: [string, number]) => b[1] - a[1];

  const mediums = Array.from(mediumCount.entries())
    .sort(sortByCount)
    .slice(0, FACETS_TOP_N)
    .map(([k]) => k);

  const genres = Array.from(genreCount.entries())
    .sort(sortByCount)
    .slice(0, FACETS_TOP_N)
    .map(([k]) => k);

  const classifications = Array.from(classificationCount.entries())
    .sort(sortByCount)
    .slice(0, FACETS_TOP_N)
    .map(([k]) => k);

  return {
    museumIds,
    mediums,
    genres,
    classifications,
  };
}
