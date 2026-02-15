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

  const titleAndMeta = exhibit ? (
    <>
      <h1 className="text-3xl font-bold text-foreground">{exhibitTitle}</h1>
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
                <AvatarImage src={exhibit.featuredArtist.image || undefined} />
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
    </>
  ) : (
    <h1 className="text-3xl font-bold text-foreground">{exhibitTitle}</h1>
  );

  return (
    <PageLayout maxWidth="max-w-none" className="w-full">
      <div className="mb-6">
        {/* Mobile: hero with featured image and overlay on bottom 30% */}
        {hasFeaturedImage && exhibit?.featuredSubmission && (
          <div className="relative aspect-square w-full md:hidden mb-6">
            <Link
              href={`${getCreatorUrl(exhibit.featuredSubmission.user)}/s/${exhibit.featuredSubmission.id}`}
              className="block relative w-full h-full overflow-hidden bg-muted"
            >
              {exhibit.featuredSubmission.imageUrl ? (
                <Image
                  src={exhibit.featuredSubmission.imageUrl}
                  alt={exhibit.featuredSubmission.title || exhibitTitle}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              ) : exhibit.featuredSubmission.text ? (
                <TextThumbnail
                  text={exhibit.featuredSubmission.text}
                  className="h-full w-full"
                />
              ) : null}
            </Link>
            <div
              className="absolute inset-x-0 bottom-0 min-h-[30%] flex flex-col justify-end p-4 text-foreground bg-gradient-to-t from-background/95 via-background/85 to-transparent"
              aria-label="Exhibit details"
            >
              <div className="absolute top-3 right-3">
                <ExhibitViewSelector
                  currentView="gallery"
                  exhibitId={exhibitId}
                  allowedViewTypes={exhibit?.allowedViewTypes}
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tight pr-24">
                {exhibitTitle}
              </h1>
              {exhibit.description && (
                <div className="text-sm text-muted-foreground [&_.prose]:text-sm mt-1">
                  <ExpandableBio html={exhibit.description} maxHeight={52} />
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                {exhibit.featuredArtist && (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={exhibit.featuredArtist.image || undefined}
                      />
                      <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
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
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={exhibit.curator.image || undefined} />
                    <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
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
                  <span className="font-medium">
                    {exhibit.curator.name || "Anonymous"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile: no featured image — title and meta only */}
        {(!hasFeaturedImage || !exhibit?.featuredSubmission) && (
          <div className="md:hidden space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {exhibitTitle}
              </h1>
              <ExhibitViewSelector
                currentView="gallery"
                exhibitId={exhibitId}
                allowedViewTypes={exhibit?.allowedViewTypes}
              />
            </div>
            {exhibit && (
              <>
                {exhibit.description && (
                  <ExpandableBio
                    html={exhibit.description}
                    className="text-muted-foreground text-sm"
                  />
                )}
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  {exhibit.featuredArtist && (
                    <div className="flex items-center gap-2">
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
              </>
            )}
          </div>
        )}

        {/* Desktop: image left, title/description right, selector top-right */}
        <div className="hidden md:flex items-start justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-6 flex-1">
            {hasFeaturedImage && exhibit?.featuredSubmission && (
              <div className="shrink-0">
                <Link
                  href={`${getCreatorUrl(exhibit.featuredSubmission.user)}/s/${exhibit.featuredSubmission.id}`}
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
            <div className="flex-1 min-w-0">{titleAndMeta}</div>
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
