import { NextResponse } from "next/server";
import { getExhibitionFacets } from "@/lib/exhibition";

export async function GET() {
  const facets = await getExhibitionFacets();
  return NextResponse.json(facets);
}
