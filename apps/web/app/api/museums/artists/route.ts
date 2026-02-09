import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ARTIST_SEARCH_LIMIT = 25;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  try {
    if (query === "") {
      // Empty query: return top artists by artwork count
      const rows = await prisma.$queryRaw<Array<{ name: string }>>`
        SELECT elem->>'name' AS name
        FROM "MuseumArtwork", jsonb_array_elements(artists::jsonb) AS elem
        WHERE elem->>'name' IS NOT NULL
          AND elem->>'name' != ''
        GROUP BY elem->>'name'
        ORDER BY COUNT(*) DESC, name
        LIMIT ${ARTIST_SEARCH_LIMIT}
      `;
      const artists = rows
        .map((r) => ({ value: r.name, label: r.name }))
        .filter((a) => a.value);
      return NextResponse.json({ artists });
    }

    const pattern = `%${query}%`;
    const rows = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT DISTINCT elem->>'name' AS name
      FROM "MuseumArtwork", jsonb_array_elements(artists::jsonb) AS elem
      WHERE elem->>'name' IS NOT NULL
        AND elem->>'name' != ''
        AND elem->>'name' ILIKE ${pattern}
      ORDER BY name
      LIMIT ${ARTIST_SEARCH_LIMIT}
    `;
    const artists = rows
      .map((r) => ({ value: r.name, label: r.name }))
      .filter((a) => a.value);
    return NextResponse.json({ artists });
  } catch (error) {
    console.error("Museum artists search error:", error);
    return NextResponse.json(
      { error: "Failed to search artists", artists: [] },
      { status: 500 },
    );
  }
}
