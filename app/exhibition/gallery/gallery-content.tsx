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
import { getCreatorUrl } from "@/lib/utils";
import { ExhibitViewSelector } from "@/components/exhibit-view-selector";

interface GalleryContentProps {
  exhibitId?: string;
  searchParams: {
    category?: string | string[];
    tag?: string | string[];
    q?: string;
  };
}

export async function GalleryContent({
  exhibitId,
  searchParams,
}: GalleryContentProps) {
  const session = await auth();

  // Normalize category to array - support both single string and array
  const categoryParam = searchParams.category;
  const categories = Array.isArray(categoryParam)
    ? categoryParam.filter((c) => c?.trim()).map((c) => c.trim())
    : categoryParam?.trim()
      ? [categoryParam.trim()]
      : [];

  // Normalize tag to array - support both single string and array
  const tagParam = searchParams.tag;
  const tags = Array.isArray(tagParam)
    ? tagParam.filter((t) => t?.trim()).map((t) => t.trim())
    : tagParam?.trim()
      ? [tagParam.trim()]
      : [];
  const query = searchParams.q?.trim() || "";

  const [
    { submissions, hasMore },
    { categories: availableCategories, tags: availableTags },
    exhibit,
  ] = await Promise.all([
    getExhibitionSubmissions({
      categories,
      tags,
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
                  href={`/creators/${exhibit.featuredSubmission.userId}/s/${exhibit.featuredSubmission.id}`}
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
                          href={getCreatorUrl(exhibit.featuredArtist)}
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
        categories={availableCategories}
        tags={availableTags}
        initialCategory={categories}
        initialTag={tags}
        initialQuery={query}
        exhibitId={exhibitId}
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
