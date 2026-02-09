import { NextResponse } from "next/server";
import { MUSEUM_PAGE_SIZE } from "@/lib/museums/constants";
import { getMuseumArtworks } from "@/lib/museums/queries";

function normalizeParam(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseIntParam(value: string | null): number | undefined {
  if (value == null) return undefined;
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const museumParams = searchParams.getAll("museum");
  const museums = museumParams
    .map((m) => normalizeParam(m))
    .filter((m): m is string => Boolean(m));

  const mediumParams = searchParams.getAll("medium");
  const mediums = mediumParams
    .map((m) => normalizeParam(m))
    .filter((m): m is string => Boolean(m));

  const genreParams = searchParams.getAll("genre");
  const genres = genreParams
    .map((g) => normalizeParam(g))
    .filter((g): g is string => Boolean(g));

  const artistParams = searchParams.getAll("artist");
  const artists = artistParams
    .map((a) => normalizeParam(a))
    .filter((a): a is string => Boolean(a));

  const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10), 0);
  const takeRaw = parseInt(
    searchParams.get("take") || `${MUSEUM_PAGE_SIZE}`,
    10,
  );
  const take = Number.isFinite(takeRaw) ? takeRaw : MUSEUM_PAGE_SIZE;

  const filters = {
    q: normalizeParam(searchParams.get("q")),
    museums: museums.length > 0 ? museums : undefined,
    artists: artists.length > 0 ? artists : undefined,
    mediums: mediums.length > 0 ? mediums : undefined,
    genres: genres.length > 0 ? genres : undefined,
    dateStart: parseIntParam(searchParams.get("dateStart")),
    dateEnd: parseIntParam(searchParams.get("dateEnd")),
    skip,
    take,
  };

  const { artworks, hasMore } = await getMuseumArtworks(filters);

  return NextResponse.json({ artworks, hasMore });
}
