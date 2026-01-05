import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getExhibitionFacets, getExhibitionSubmissions } from "@/lib/exhibition";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";
import { Header } from "@/components/header";
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

  const [{ submissions, hasMore }, { categories, tags }] =
    await Promise.all([
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Exhibition" user={session?.user} />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="mb-10 rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-amber-50 p-8 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
            Gallery
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
                Explore the community gallery
              </h1>
              <p className="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
                Browse public work from prompts and portfolios. Filter by
                category, jump into tags, or search for the ideas you want to
                see next.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-amber-200/70 bg-white px-4 py-2 text-sm font-medium text-amber-700 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9l7-7 7 7M5 21h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z"
                />
              </svg>
              {submissions.length} piece{submissions.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

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
      </main>
    </div>
  );
}

