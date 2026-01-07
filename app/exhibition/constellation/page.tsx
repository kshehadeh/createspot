import type { Metadata } from "next";
import {
  getExhibitionFacets,
  getExhibitionSubmissions,
} from "@/lib/exhibition";
import { PageLayout } from "@/components/page-layout";
import { ExhibitionFilters } from "../exhibition-filters";
import { ConstellationSphere } from "@/components/constellation-sphere";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Constellation Exhibition | Create Spot",
  description:
    "Explore the community gallery in an interactive 3D constellation. Discover creative work from the Create Spot community.",
  openGraph: {
    title: "Constellation Exhibition | Create Spot",
    description:
      "Explore the community gallery in an interactive 3D constellation. Discover creative work from the Create Spot community.",
    type: "website",
  },
};

interface ConstellationExhibitionPageProps {
  searchParams: Promise<{
    category?: string | string[];
    tag?: string | string[];
    q?: string | string[];
  }>;
}

export default async function ConstellationExhibitionPage({
  searchParams,
}: ConstellationExhibitionPageProps) {
  const params = await searchParams;

  const rawCategory = Array.isArray(params.category)
    ? params.category[0]
    : params.category;
  const rawTag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;

  const category = rawCategory?.trim() || "";
  const tag = rawTag?.trim() || "";
  const query = rawQuery?.trim() || "";

  const [{ submissions }, { categories, tags }] = await Promise.all([
    getExhibitionSubmissions({
      category,
      tag,
      query,
      skip: 0,
      take: 50, // Show more items in constellation view
    }),
    getExhibitionFacets(),
  ]);

  // Transform submissions to constellation format
  const constellationWork = submissions.map((submission) => {
    const promptWord =
      submission.prompt && typeof submission.wordIndex === "number"
        ? ([
            submission.prompt.word1,
            submission.prompt.word2,
            submission.prompt.word3,
          ][submission.wordIndex - 1] ?? null)
        : null;

    return {
      id: submission.id,
      imageUrl: submission.imageUrl,
      text: submission.text,
      title: submission.title,
      promptWord,
    };
  });

  return (
    <PageLayout>
      <ExhibitionFilters
        categories={categories}
        tags={tags}
        initialCategory={category}
        initialTag={tag}
        initialQuery={query}
      />

      {constellationWork.length > 0 ? (
        <section className="mb-10">
          <div className="flex flex-col gap-10">
            <ConstellationSphere items={constellationWork} />
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {query || category || tag
              ? "No work matches your filters."
              : "No public work available yet."}
          </p>
        </div>
      )}
    </PageLayout>
  );
}
