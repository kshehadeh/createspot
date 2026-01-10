import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  getExhibitionFacets,
  getExhibitionSubmissions,
} from "@/lib/exhibition";
import { getExhibitById } from "@/lib/exhibits";
import { PageLayout } from "@/components/page-layout";
import { ExhibitionFilters } from "../exhibition-filters";
import { ConstellationSphere } from "@/components/constellation-sphere";
import { ExpandableBio } from "@/components/expandable-bio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExhibitViewSelector } from "@/components/exhibit-view-selector";

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
    exhibitId?: string | string[];
  }>;
}

export default async function ConstellationExhibitionPage({
  searchParams,
}: ConstellationExhibitionPageProps) {
  const [_session, params] = await Promise.all([auth(), searchParams]);

  const rawCategory = Array.isArray(params.category)
    ? params.category[0]
    : params.category;
  const rawTag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const rawExhibitId = Array.isArray(params.exhibitId)
    ? params.exhibitId[0]
    : params.exhibitId;

  const category = rawCategory?.trim() || "";
  const tag = rawTag?.trim() || "";
  const query = rawQuery?.trim() || "";
  const exhibitId = rawExhibitId?.trim() || undefined;

  const [{ submissions }, { categories, tags }, exhibit] = await Promise.all([
    getExhibitionSubmissions({
      category,
      tag,
      query,
      exhibitId,
      skip: 0,
      take: 50, // Show more items in constellation view
    }),
    getExhibitionFacets(exhibitId),
    exhibitId ? getExhibitById(exhibitId) : Promise.resolve(null),
  ]);

  const exhibitTitle = exhibit
    ? exhibit.title
    : "Create Spot Permanent Exhibit";

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
    <PageLayout maxWidth="max-w-none">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              {exhibitTitle}
            </h1>
            {exhibit && (
              <div className="mt-4 space-y-3">
                {exhibit.description && (
                  <ExpandableBio
                    html={exhibit.description}
                    className="text-muted-foreground"
                  />
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {exhibit.featuredArtist && (
                    <div className="flex items-center gap-2">
                      <span>Featured Artist</span>
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={exhibit.featuredArtist.image || undefined}
                        />
                        <AvatarFallback className="bg-muted text-xs">
                          {exhibit.featuredArtist.name
                            ? exhibit.featuredArtist.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <Link
                        href={`/profile/${exhibit.featuredArtist.id}`}
                        className="font-medium hover:underline"
                      >
                        {exhibit.featuredArtist.name || "Anonymous"}
                      </Link>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>Curated by</span>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={exhibit.curator.image || undefined} />
                      <AvatarFallback className="bg-muted text-xs">
                        {exhibit.curator.name
                          ? exhibit.curator.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{exhibit.curator.name || "Anonymous"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <ExhibitViewSelector
            currentView="constellation"
            exhibitId={exhibitId}
            allowedViewTypes={exhibit?.allowedViewTypes}
          />
        </div>
      </div>
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
