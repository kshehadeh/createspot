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

  // Support multiple tags - get all tag params
  const tagParams = searchParams.getAll("tag");
  const tags = tagParams
    .map((t) => t?.trim())
    .filter((t): t is string => Boolean(t));

  // Support multiple categories - get all category params
  const categoryParams = searchParams.getAll("category");
  const categories = categoryParams
    .map((c) => c?.trim())
    .filter((c): c is string => Boolean(c));

  const filters: ExhibitionFilterInput = {
    categories: categories.length > 0 ? categories : undefined,
    tags: tags.length > 0 ? tags : undefined,
    query: normalizeParam(searchParams.get("q")),
    userId: normalizeParam(searchParams.get("userId")),
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
