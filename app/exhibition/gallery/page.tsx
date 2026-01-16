import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import {
  getExhibitionFacets,
  getExhibitionSubmissions,
} from "@/lib/exhibition";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";
import { getExhibitById } from "@/lib/exhibits";
import { PageLayout } from "@/components/page-layout";
import { ExhibitionFilters } from "../exhibition-filters";
import { ExhibitionGrid } from "../exhibition-grid";
import { ExpandableBio } from "@/components/expandable-bio";
import { TextThumbnail } from "@/components/text-thumbnail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExhibitViewSelector } from "@/components/exhibit-view-selector";

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
    exhibitId?: string | string[];
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
  const rawExhibitId = Array.isArray(params.exhibitId)
    ? params.exhibitId[0]
    : params.exhibitId;

  const category = rawCategory?.trim() || "";
  const tag = rawTag?.trim() || "";
  const query = rawQuery?.trim() || "";
  const exhibitId = rawExhibitId?.trim() || undefined;

  const [{ submissions, hasMore }, { categories, tags }, exhibit] =
    await Promise.all([
      getExhibitionSubmissions({
        category,
        tag,
        query,
        exhibitId,
        skip: 0,
        take: EXHIBITION_PAGE_SIZE,
      }),
      getExhibitionFacets(exhibitId),
      exhibitId ? getExhibitById(exhibitId) : Promise.resolve(null),
    ]);

  const exhibitTitle = exhibit
    ? exhibit.title
    : "Create Spot Permanent Exhibit";

  const hasFeaturedImage =
    exhibit?.featuredSubmission?.imageUrl || exhibit?.featuredSubmission?.text;

  return (
    <PageLayout maxWidth="max-w-none" className="w-full">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-6 flex-1">
            {/* Featured Image - Left Side */}
            {hasFeaturedImage && exhibit?.featuredSubmission && (
              <div className="shrink-0">
                <Link
                  href={`/s/${exhibit.featuredSubmission.id}`}
                  className="block relative w-full sm:w-48 md:w-56 aspect-square rounded-lg overflow-hidden border border-border bg-muted transition-transform hover:scale-[1.02]"
                >
                  {exhibit.featuredSubmission.imageUrl ? (
                    <Image
                      src={exhibit.featuredSubmission.imageUrl}
                      alt={exhibit.featuredSubmission.title || exhibitTitle}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 224px"
                    />
                  ) : exhibit.featuredSubmission.text ? (
                    <TextThumbnail
                      text={exhibit.featuredSubmission.text}
                      className="h-full w-full"
                    />
                  ) : null}
                </Link>
              </div>
            )}

            {/* Title and Description - Right Side */}
            <div className="flex-1 min-w-0">
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
          </div>
          <ExhibitViewSelector
            currentView="gallery"
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

      <ExhibitionGrid
        submissions={submissions.map((submission) => ({
          ...submission,
          imageFocalPoint: submission.imageFocalPoint as
            | { x: number; y: number }
            | null
            | undefined,
        }))}
        isLoggedIn={!!session?.user}
        initialHasMore={hasMore}
      />
    </PageLayout>
  );
}
