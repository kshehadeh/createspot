import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { HistoryList } from "@/app/prompt/history/history-list";
import { SocialLinks } from "./social-links";
import { ExpandableImage } from "@/components/expandable-image";
import { ExpandableText } from "@/components/expandable-text";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { ProfileAnalytics } from "@/components/profile-analytics";
import { ProfileViewTracker } from "@/components/profile-view-tracker";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}

export default async function ProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { userId } = await params;
  const paramsSearch = await searchParams;
  const session = await auth();

  // Check if public view is requested
  const viewParam = Array.isArray(paramsSearch.view)
    ? paramsSearch.view[0]
    : paramsSearch.view;
  const isPublicViewRequested = viewParam === "public";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      bio: true,
      instagram: true,
      twitter: true,
      linkedin: true,
      website: true,
      featuredSubmissionId: true,
    },
  });

  if (!user) {
    notFound();
  }

  const isOwnProfile = session?.user?.id === user.id;
  const isLoggedIn = !!session?.user;

  // When viewing own profile with ?view=public, show public view
  const isPublicView = isOwnProfile && isPublicViewRequested;
  const effectiveIsOwnProfile = isOwnProfile && !isPublicView;

  // Build share status filter based on ownership and view mode
  const shareStatusFilter = effectiveIsOwnProfile
    ? {} // Owner sees all their items in private view
    : { shareStatus: { in: ["PROFILE" as const, "PUBLIC" as const] } }; // Public view shows PROFILE and PUBLIC only

  // Fetch portfolio items
  const portfolioItems = await prisma.submission.findMany({
    where: {
      userId: user.id,
      isPortfolio: true,
      ...shareStatusFilter,
    },
    orderBy: [
      { portfolioOrder: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      prompt: {
        select: {
          word1: true,
          word2: true,
          word3: true,
        },
      },
      _count: {
        select: { favorites: true },
      },
    },
  });

  // Fetch prompt submissions (only those linked to prompts)
  const prompts = await prisma.prompt.findMany({
    where: {
      submissions: {
        some: {
          userId: user.id,
          ...shareStatusFilter,
        },
      },
    },
    orderBy: { weekStart: "desc" },
    take: 11,
    include: {
      submissions: {
        where: {
          userId: user.id,
          ...shareStatusFilter,
        },
        orderBy: { wordIndex: "asc" },
      },
    },
  });

  const hasMore = prompts.length > 10;
  const initialItems = hasMore ? prompts.slice(0, 10) : prompts;

  // Count submissions - filter by share status in public view
  const submissionCount = await prisma.submission.count({
    where: {
      userId: user.id,
      ...(effectiveIsOwnProfile
        ? {}
        : { shareStatus: { in: ["PROFILE" as const, "PUBLIC" as const] } }),
    },
  });

  const hasSocialLinks =
    user.instagram || user.twitter || user.linkedin || user.website;

  // Fetch featured submission if set
  const featuredSubmissionRaw = user.featuredSubmissionId
    ? await prisma.submission.findUnique({
        where: { id: user.featuredSubmissionId },
        include: {
          prompt: {
            select: {
              word1: true,
              word2: true,
              word3: true,
            },
          },
        },
      })
    : null;

  // Only show featured submission if share status allows it
  const featuredSubmission =
    featuredSubmissionRaw &&
    (effectiveIsOwnProfile ||
      featuredSubmissionRaw.shareStatus === "PROFILE" ||
      featuredSubmissionRaw.shareStatus === "PUBLIC")
      ? featuredSubmissionRaw
      : null;

  return (
    <PageLayout maxWidth="max-w-5xl">
      {/* Track profile view for non-owners (not in public view mode) */}
      {!effectiveIsOwnProfile && <ProfileViewTracker profileUserId={user.id} />}

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name || "User"}
                className="h-16 w-16 rounded-full"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <span className="text-2xl font-medium text-muted-foreground">
                  {user.name?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {user.name || "Anonymous"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {submissionCount} work{submissionCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwnProfile && !isPublicView && (
              <Link
                href={`/profile/${user.id}?view=public`}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                View as Public
              </Link>
            )}
            {isOwnProfile && isPublicView && (
              <Link
                href={`/profile/${user.id}`}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                View as Owner
              </Link>
            )}
            {effectiveIsOwnProfile && (
              <Link
                href="/profile/edit"
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {user.bio && (
          <div
            className="prose prose-sm dark:prose-invert mt-4 max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: user.bio }}
          />
        )}

        {hasSocialLinks && (
          <SocialLinks
            instagram={user.instagram}
            twitter={user.twitter}
            linkedin={user.linkedin}
            website={user.website}
          />
        )}
      </div>

      {/* Analytics - only visible to profile owner in private view */}
      {effectiveIsOwnProfile && <ProfileAnalytics userId={user.id} />}

      {/* Main content area: Featured on left, Gallery on right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Featured Submission - Left Sidebar */}
        {featuredSubmission && (
          <div className="lg:col-span-1">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              Featured
            </h2>
            {(() => {
              const hasImage = !!featuredSubmission.imageUrl;
              const hasText = !!featuredSubmission.text;
              const word =
                featuredSubmission.prompt && featuredSubmission.wordIndex
                  ? [
                      featuredSubmission.prompt.word1,
                      featuredSubmission.prompt.word2,
                      featuredSubmission.prompt.word3,
                    ][featuredSubmission.wordIndex - 1]
                  : null;

              return (
                <Card className="rounded-xl">
                  <CardContent className="p-6">
                    {/* Image section */}
                    {hasImage && (
                      <div className="mb-4">
                        <div className="rounded-lg border border-border bg-muted p-4">
                          <ExpandableImage
                            imageUrl={featuredSubmission.imageUrl!}
                            alt={featuredSubmission.title || word || "Featured"}
                            className="min-h-[200px]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Text section */}
                    {hasText && (
                      <div className="mb-4">
                        <div className="rounded-lg border border-border bg-muted p-4">
                          {featuredSubmission.title && (
                            <h3 className="mb-3 text-lg font-semibold text-foreground">
                              {featuredSubmission.title}
                            </h3>
                          )}
                          <ExpandableText
                            text={featuredSubmission.text!}
                            title={featuredSubmission.title}
                          />
                        </div>
                      </div>
                    )}

                    {/* Link to full submission */}
                    <div className="flex flex-col gap-3 border-t border-border pt-4">
                      {featuredSubmission.prompt &&
                        featuredSubmission.wordIndex && (
                          <div className="flex flex-col gap-2">
                            <span className="text-xs text-muted-foreground">
                              Prompt:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {[
                                featuredSubmission.prompt.word1,
                                featuredSubmission.prompt.word2,
                                featuredSubmission.prompt.word3,
                              ].map((promptWord, index) => {
                                const isActive =
                                  index + 1 === featuredSubmission.wordIndex;
                                return (
                                  <span
                                    key={index}
                                    className={`text-sm font-medium ${
                                      isActive
                                        ? "text-foreground"
                                        : "text-muted-foreground/50"
                                    }`}
                                  >
                                    {promptWord}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      <Link
                        href={`/s/${featuredSubmission.id}`}
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        View full submission →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        )}

        {/* Gallery Section - Main Content Area */}
        <div
          className={featuredSubmission ? "lg:col-span-2" : "lg:col-span-3"}
        >
          {/* Portfolio Section */}
          {portfolioItems.length > 0 && (
            <div className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  Portfolio
                </h2>
                {effectiveIsOwnProfile && (
                  <Link
                    href="/profile/edit#portfolio"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Manage Portfolio →
                  </Link>
                )}
              </div>
              <PortfolioGrid
                items={portfolioItems}
                isLoggedIn={isLoggedIn}
                isOwnProfile={effectiveIsOwnProfile}
              />
            </div>
          )}

          {/* Prompt Submissions Section */}
          {initialItems.length > 0 && (
            <div>
              <h2 className="mb-6 text-2xl font-semibold text-foreground">
                Prompt Submissions
              </h2>
              <HistoryList
                initialItems={initialItems.map((p) => ({
                  ...p,
                  weekStart: p.weekStart.toISOString(),
                  weekEnd: p.weekEnd.toISOString(),
                }))}
                initialHasMore={hasMore}
                userId={user.id}
              />
            </div>
          )}

          {/* Empty state */}
          {portfolioItems.length === 0 && initialItems.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-muted-foreground">
                {effectiveIsOwnProfile
                  ? "You haven't added any work yet. Start by adding portfolio items or submitting to prompts."
                  : "No work to display yet."}
              </p>
              {effectiveIsOwnProfile && (
                <div className="mt-4 flex justify-center gap-3">
                  <Link
                    href="/profile/edit#portfolio"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Add Portfolio Item
                  </Link>
                  <Link
                    href="/prompt/play"
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    Submit to Prompt
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
