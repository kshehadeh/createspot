import { NextResponse } from "next/server";
import {
  getExhibitionSubmissions,
  type ExhibitionFilterInput,
} from "@/lib/exhibition";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";

function normalizeParam(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filters: ExhibitionFilterInput = {
    category: normalizeParam(searchParams.get("category")),
    tag: normalizeParam(searchParams.get("tag")),
    query: normalizeParam(searchParams.get("q")),
  };

  const skip = Math.max(parseInt(searchParams.get("skip") || "0", 10), 0);
  const takeRaw = parseInt(
    searchParams.get("take") || `${EXHIBITION_PAGE_SIZE}`,
    10,
  );
  const take = Number.isFinite(takeRaw) ? takeRaw : EXHIBITION_PAGE_SIZE;

  const { submissions, hasMore } = await getExhibitionSubmissions({
    ...filters,
    skip,
    take,
  });

  return NextResponse.json({ submissions, hasMore });
}
