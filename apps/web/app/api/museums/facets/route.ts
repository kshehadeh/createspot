import { NextResponse } from "next/server";
import { getMuseumFacets } from "@/lib/museums/queries";

export async function GET() {
  const facets = await getMuseumFacets();
  return NextResponse.json(facets);
}
