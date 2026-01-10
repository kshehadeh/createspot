import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { HistoryList } from "@/app/prompt/history/history-list";
import { SocialLinks } from "./social-links";
import { FeaturedSubmission } from "@/components/featured-submission";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { ProfileAnalytics } from "@/components/profile-analytics";
import { ProfileViewTracker } from "@/components/profile-view-tracker";
import { ExpandableBio } from "@/components/expandable-bio";
import { ProfileShareButton } from "@/components/profile-share-button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}

async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      bio: true,
    },
  });

  return user;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await getUser(userId);

  if (!user) {
    return {
      title: "Profile Not Found | Create Spot",
    };
  }

  const creatorName = user.name || "Anonymous";
  const pageTitle = `${creatorName} | Create Spot`;

  // Use bio if available, otherwise use generic description with creator indication
  let description: string;
  if (user.bio) {
    // Strip HTML tags from bio for description
    description = user.bio.replace(/<[^>]*>/g, "").trim();
  } else {
    description =
      "A creative community for artists and writers to share their work, build portfolios, and participate in weekly creative prompts. Profile for a creator on Create Spot.";
  }

  // Generate absolute OG image URL - Next.js will automatically use opengraph-image.tsx
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const ogImageUrl = `${baseUrl}/profile/${userId}/opengraph-image`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      images: [ogImageUrl],
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImageUrl],
    },
  };
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
    orderBy: [{ portfolioOrder: "asc" }, { createdAt: "desc" }],
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
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              favorites: true,
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

      {/* Public View indicator - fixed below navbar */}
      {isOwnProfile && isPublicView && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-3 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
          <span>Public View</span>
          <Link
            href={`/profile/${user.id}`}
            className="text-white underline transition-opacity hover:opacity-80"
          >
            Exit →
          </Link>
        </div>
      )}

      <div className="mb-8 w-full min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name || "User"}
                className="hidden h-16 w-16 rounded-full md:block"
              />
            ) : (
              <div className="hidden h-16 w-16 items-center justify-center rounded-full bg-muted md:flex">
                <span className="text-2xl font-medium text-muted-foreground">
                  {user.name?.charAt(0) || "?"}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold text-foreground truncate">
                  {user.name || "Anonymous"}
                </h1>
                <ProfileShareButton userId={user.id} />
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {submissionCount} work{submissionCount !== 1 ? "s" : ""}
                </p>
                {hasSocialLinks && (
                  <SocialLinks
                    instagram={user.instagram}
                    twitter={user.twitter}
                    linkedin={user.linkedin}
                    website={user.website}
                    variant="minimal"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {isOwnProfile && !isPublicView && (
              <Link
                href={`/profile/${user.id}?view=public`}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View as Anonymous User →
              </Link>
            )}
            {isOwnProfile && !isPublicView && (
              <Link
                href="/profile/edit"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Edit Profile →
              </Link>
            )}
          </div>
        </div>

        {user.bio && <ExpandableBio html={user.bio} className="mt-4" />}
      </div>

      {/* Analytics - only visible to profile owner in private view */}
      {effectiveIsOwnProfile && <ProfileAnalytics userId={user.id} />}

      {/* Main content area: Featured on left, Gallery on right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 w-full min-w-0">
        {/* Featured Submission - Left Sidebar */}
        {featuredSubmission && (
          <div className="lg:col-span-1">
            <h2 className="mb-6 text-2xl font-semibold text-foreground">
              Featured
            </h2>
            <FeaturedSubmission submission={featuredSubmission} />
          </div>
        )}

        {/* Gallery Section - Main Content Area */}
        <div
          className={cn(
            featuredSubmission ? "lg:col-span-2" : "lg:col-span-3",
            "w-full min-w-0",
          )}
        >
          {/* Portfolio Section */}
          {portfolioItems.length > 0 && (
            <div className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  Portfolio
                </h2>
                <div className="flex flex-col items-end gap-2">
                  <Link
                    href={`/portfolio/${user.id}`}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View Portfolio →
                  </Link>
                  {effectiveIsOwnProfile && (
                    <Link
                      href="/portfolio/edit"
                      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Manage Portfolio →
                    </Link>
                  )}
                </div>
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
                    href="/portfolio/edit"
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
