import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import {
  getExhibitionFacets,
  getExhibitionSubmissions,
} from "@/lib/exhibition";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";
import { PageLayout } from "@/components/page-layout";
import { ExhibitionFilters } from "../exhibition-filters";
import { ExhibitionGrid } from "../exhibition-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery Exhibition | Create Spot",
  description:
    "Browse public work from the Create Spot community. Filter by category or tag, or search by keyword to find your next source of inspiration.",
  openGraph: {
    title: "Gallery Exhibition | Create Spot",
    description:
      "Browse public work from the Create Spot community. Filter by category or tag, or search by keyword to find your next source of inspiration.",
    type: "website",
  },
};

interface GalleryExhibitionPageProps {
  searchParams: Promise<{
    category?: string | string[];
    tag?: string | string[];
    q?: string | string[];
  }>;
}

export default async function GalleryExhibitionPage({
  searchParams,
}: GalleryExhibitionPageProps) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  const rawCategory = Array.isArray(params.category)
    ? params.category[0]
    : params.category;
  const rawTag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;

  const category = rawCategory?.trim() || "";
  const tag = rawTag?.trim() || "";
  const query = rawQuery?.trim() || "";

  const [{ submissions, hasMore }, { categories, tags }] = await Promise.all([
    getExhibitionSubmissions({
      category,
      tag,
      query,
      skip: 0,
      take: EXHIBITION_PAGE_SIZE,
    }),
    getExhibitionFacets(),
  ]);

  return (
    <PageLayout maxWidth="max-w-none" className="w-full">
      <ExhibitionFilters
        categories={categories}
        tags={tags}
        initialCategory={category}
        initialTag={tag}
        initialQuery={query}
      />

      <ExhibitionGrid
        submissions={submissions}
        isLoggedIn={!!session?.user}
        initialHasMore={hasMore}
      />
    </PageLayout>
  );
}
