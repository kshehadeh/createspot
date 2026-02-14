import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getExhibitById } from "@/lib/exhibits";
import { getExhibitMetadata } from "@/lib/og-metadata";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeaturedSubmission } from "@/components/featured-submission";
import { ExpandableBio } from "@/components/expandable-bio";
import { EXHIBITION_CONFIGS } from "@/lib/exhibition-constants";
import { getCreatorUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ExhibitPageProps {
  params: Promise<{ exhibitId: string }>;
}

export async function generateMetadata({
  params,
}: ExhibitPageProps): Promise<Metadata> {
  const { exhibitId } = await params;
  const exhibit = await getExhibitById(exhibitId);

  if (!exhibit) {
    return { title: "Exhibit Not Found | Create Spot" };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return getExhibitMetadata(
    {
      id: exhibit.id,
      title: exhibit.title,
      description: exhibit.description,
    },
    baseUrl,
  );
}

export default async function ExhibitPage({ params }: ExhibitPageProps) {
  const { exhibitId } = await params;
  const [session, exhibit] = await Promise.all([
    auth(),
    getExhibitById(exhibitId),
  ]);

  if (!exhibit) {
    notFound();
  }

  // Fetch full featured submission data if it exists
  let featuredSubmission = null;
  if (exhibit.featuredSubmissionId) {
    const submission = await prisma.submission.findUnique({
      where: { id: exhibit.featuredSubmissionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            slug: true,
          },
        },
        prompt: {
          select: {
            word1: true,
            word2: true,
            word3: true,
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    });
    if (submission) {
      featuredSubmission = {
        id: submission.id,
        title: submission.title,
        imageUrl: submission.imageUrl,
        text: submission.text,
        wordIndex: submission.wordIndex,
        prompt: submission.prompt,
        shareStatus: submission.shareStatus,
        critiquesEnabled: submission.critiquesEnabled,
        user: submission.user,
        _count: submission._count,
      };
    }
  }

  const viewTypes = [
    {
      value: "gallery" as const,
      label: "Grid",
      path: `/exhibition/gallery/grid/${exhibitId}`,
      enabled: exhibit.allowedViewTypes.includes("gallery"),
      description:
        "Browse submissions in a grid layout with filtering and search options.",
    },
    {
      value: "constellation" as const,
      label: EXHIBITION_CONFIGS.constellation.name,
      path: `/exhibition/gallery/path/${exhibitId}`,
      enabled: exhibit.allowedViewTypes.includes("constellation"),
      description:
        "Explore submissions along an interactive path through the exhibit.",
    },
    // Map/global view is not available for temporary exhibits
  ].filter((vt) => vt.enabled);

  const titleBlock = (
    <>
      <div className="flex items-start justify-between gap-4 mb-3">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {exhibit.title}
        </h1>
        {session?.user?.isAdmin && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/exhibits/${exhibitId}/edit`}>Edit Exhibit</Link>
          </Button>
        )}
      </div>
      {exhibit.description && (
        <ExpandableBio html={exhibit.description} className="mt-3" />
      )}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {exhibit.featuredArtist && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Featured Artist
            </span>
            <Avatar className="h-6 w-6">
              <AvatarImage src={exhibit.featuredArtist.image || undefined} />
              <AvatarFallback className="bg-muted text-muted-foreground text-xs">
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
              className="text-sm font-medium hover:underline"
            >
              {exhibit.featuredArtist.name || "Anonymous"}
            </Link>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Curated by</span>
          <Avatar className="h-6 w-6">
            <AvatarImage src={exhibit.curator.image || undefined} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
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
          <span className="text-sm font-medium">
            {exhibit.curator.name || "Anonymous"}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <PageLayout maxWidth="max-w-6xl">
      {/* Title block: on mobile with featured image it's in the hero overlay; otherwise always visible */}
      <div className={`mb-8 ${featuredSubmission ? "hidden md:block" : ""}`}>
        {titleBlock}
      </div>

      {featuredSubmission ? (
        <div className="mb-8">
          {/* Mobile: hero with featured image and overlay on bottom 30% */}
          <div className="relative aspect-square w-full md:hidden mb-6">
            <FeaturedSubmission submission={featuredSubmission} />
            <div
              className="absolute inset-x-0 bottom-0 min-h-[30%] flex flex-col justify-end p-4 text-foreground bg-gradient-to-t from-background/95 via-background/85 to-transparent"
              aria-label="Exhibit details"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h1 className="text-2xl font-bold tracking-tight shrink-0">
                  {exhibit.title}
                </h1>
                {session?.user?.isAdmin && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <Link href={`/admin/exhibits/${exhibitId}/edit`}>
                      Edit Exhibit
                    </Link>
                  </Button>
                )}
              </div>
              {exhibit.description && (
                <div className="text-sm text-muted-foreground [&_a]:text-primary [&_.prose]:text-sm">
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

          <h2 className="mb-4 text-xl font-semibold hidden md:block">
            Featured
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Featured Submission - hidden on mobile (shown in hero above) */}
            <div className="hidden md:block">
              <FeaturedSubmission submission={featuredSubmission} />
            </div>

            {/* View Exhibit Cards */}
            <div className="flex flex-col gap-3">
              {viewTypes.map((viewType) => {
                const Icon = EXHIBITION_CONFIGS[viewType.value].icon;
                return (
                  <Card
                    key={viewType.value}
                    className="transition-all hover:shadow-md"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          {viewType.label}
                        </CardTitle>
                      </div>
                      <CardDescription>{viewType.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={viewType.path}>View {viewType.label}</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {viewTypes.map((viewType) => {
              const Icon = EXHIBITION_CONFIGS[viewType.value].icon;
              return (
                <Card
                  key={viewType.value}
                  className="transition-all hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">
                        {viewType.label}
                      </CardTitle>
                    </div>
                    <CardDescription>{viewType.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <Link href={viewType.path}>View {viewType.label}</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
