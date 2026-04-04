import { Briefcase, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExpandableBio } from "@/components/expandable-bio";
import { FollowButton } from "@/components/follow-button";
import { HintPopover } from "@/components/hint-popover";
import { PageLayout } from "@/components/page-layout";
import { PortfolioGridProfile } from "@/components/portfolio-grid";
import { ProfileAnalytics } from "@/components/profile-analytics";
import { ProfileBadges } from "@/components/profile-badges";
import { ProfileImageViewer } from "@/components/profile-image-viewer";
import { ProfileViewTracker } from "@/components/profile-view-tracker";
import { ShareButton } from "@/components/share-button";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getTutorialData } from "@/lib/get-tutorial-data";
import { getNextPageHint } from "@/lib/hints-helper";
import { getObjectPositionStyle } from "@/lib/image-utils";
import { prisma } from "@/lib/prisma";
import { getUserImageUrl } from "@/lib/user-image";
import { getCreatorUrl } from "@/lib/utils";
import {
  getCachedPublicProfileData,
  getDynamicOwnerProfileData,
  getProfileMetadataUser,
} from "./profile-data";

const MAX_PORTFOLIO_ITEMS = 10;

interface ProfilePageProps {
  params: Promise<{ creatorid: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { creatorid } = await params;
  const user = await getProfileMetadataUser(creatorid);
  const t = await getTranslations("profile");

  if (!user) {
    return {
      title: `${t("profileNotFound")} | Create Spot`,
    };
  }

  const creatorName = user.name || t("anonymous");
  const pageTitle = `${creatorName} | Create Spot`;

  // Use bio if available, otherwise use generic description with creator indication
  let description: string;
  if (user.bio) {
    // Strip HTML tags from bio for description
    description = user.bio.replace(/<[^>]*>/g, "").trim();
  } else {
    description =
      "A creative community for artists and writers to share their work and build portfolios. Profile for a creator on Create Spot.";
  }

  // Generate absolute OG image URL - Next.js will automatically use opengraph-image.tsx
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const ogImageUrl = `${baseUrl}/creators/${creatorid}/opengraph-image`;

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
  const { creatorid } = await params;
  const paramsSearch = await searchParams;
  const session = await auth();
  const t = await getTranslations("profile");

  // Check if public view is requested
  const viewParam = Array.isArray(paramsSearch.view)
    ? paramsSearch.view[0]
    : paramsSearch.view;
  const isPublicViewRequested = viewParam === "public";

  const metadataUser = await getProfileMetadataUser(creatorid);

  if (!metadataUser) {
    notFound();
  }

  const isOwnProfile = session?.user?.id === metadataUser.id;
  const isLoggedIn = !!session?.user;

  // When viewing own profile with ?view=public, show public view
  const isPublicView = isOwnProfile && isPublicViewRequested;
  const effectiveIsOwnProfile = isOwnProfile && !isPublicView;
  const profileData = effectiveIsOwnProfile
    ? await getDynamicOwnerProfileData(creatorid)
    : await getCachedPublicProfileData(creatorid);

  if (!profileData) {
    notFound();
  }

  const {
    user,
    portfolioItems,
    allPortfolioItems,
    submissionCount,
    featuredSubmission,
    hasSocialLinks,
  } = profileData;

  let isFollowingCreator = false;
  if (session?.user && !isOwnProfile) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: user.id,
        },
      },
    });
    isFollowingCreator = !!follow;
  }

  // Get tutorial data for hints
  const tutorialData = await getTutorialData(session?.user?.id);

  return (
    <PageLayout maxWidth="max-w-5xl">
      {/* Track profile view for non-owners (not in public view mode) */}
      {!effectiveIsOwnProfile && <ProfileViewTracker profileUserId={user.id} />}

      {!effectiveIsOwnProfile &&
      featuredSubmission &&
      (featuredSubmission.imageUrl || featuredSubmission.text) ? (
        <div className="mb-8 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] -mt-12 bg-muted overflow-hidden min-h-[60vh] flex flex-col">
          {/* Hero Image/Background */}
          <div className="absolute inset-0">
            {featuredSubmission.imageUrl ? (
              <Image
                src={featuredSubmission.imageUrl}
                alt={featuredSubmission.title || "Featured submission"}
                fill
                className="object-cover"
                sizes="100vw"
                style={{
                  objectPosition: getObjectPositionStyle(
                    featuredSubmission.imageFocalPoint as {
                      x: number;
                      y: number;
                    } | null,
                  ),
                }}
              />
            ) : featuredSubmission.text ? (
              <div className="relative h-full w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div className="absolute inset-0 p-8 md:p-12 lg:p-16 pb-32 overflow-hidden">
                  <div
                    className="text-4xl font-serif leading-relaxed text-zinc-600 dark:text-zinc-400"
                    dangerouslySetInnerHTML={{
                      __html: featuredSubmission.text,
                    }}
                  />
                </div>
                {/* Gradient fade at bottom - stays within text area, doesn't overlap profile info */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-zinc-100 via-zinc-100/80 to-transparent dark:from-zinc-800 dark:via-zinc-800/80 pointer-events-none" />
              </div>
            ) : null}
          </div>

          {/* Profile Info Overlay - Bottom */}
          <div className="relative mt-auto z-20">
            <div className="bg-background/80 backdrop-blur-sm px-6 py-4 max-w-5xl mx-auto w-full">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {(() => {
                    const displayImage = getUserImageUrl(
                      user.profileImageUrl,
                      user.image,
                    );
                    return displayImage ? (
                      <ProfileImageViewer
                        profileImageUrl={user.profileImageUrl}
                        oauthImage={user.image}
                        profileImageFocalPoint={
                          user.profileImageFocalPoint as {
                            x: number;
                            y: number;
                          } | null
                        }
                        name={user.name}
                        className="h-12 w-12 rounded-full md:h-16 md:w-16 ring-2 ring-background/50 object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 flex items-center justify-center rounded-full bg-muted md:h-16 md:w-16 ring-2 ring-background/50 shrink-0">
                        <span className="text-xl font-medium text-muted-foreground md:text-2xl">
                          {user.name?.charAt(0) || "?"}
                        </span>
                      </div>
                    );
                  })()}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl font-semibold text-foreground truncate">
                        {user.name || t("anonymous")}
                      </h1>
                      <ShareButton
                        type="profile"
                        userId={user.id}
                        slug={user.slug}
                      />
                      {isLoggedIn && !effectiveIsOwnProfile && (
                        <FollowButton
                          targetUserId={user.id}
                          initialIsFollowing={isFollowingCreator}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-foreground/90">
                        {submissionCount}{" "}
                        {submissionCount !== 1 ? t("works") : t("work")}
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
              </div>

              {user.bio && (
                <div className="mt-4">
                  <ExpandableBio
                    html={user.bio}
                    className="text-foreground/90"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 w-full min-w-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {(() => {
                const displayImage = getUserImageUrl(
                  user.profileImageUrl,
                  user.image,
                );
                return displayImage ? (
                  <ProfileImageViewer
                    profileImageUrl={user.profileImageUrl}
                    oauthImage={user.image}
                    profileImageFocalPoint={
                      user.profileImageFocalPoint as {
                        x: number;
                        y: number;
                      } | null
                    }
                    name={user.name}
                    className="h-12 w-12 rounded-full md:h-16 md:w-16 object-cover shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-muted md:h-16 md:w-16 shrink-0">
                    <span className="text-xl font-medium text-muted-foreground md:text-2xl">
                      {user.name?.charAt(0) || "?"}
                    </span>
                  </div>
                );
              })()}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-semibold text-foreground truncate">
                    {user.name || t("anonymous")}
                  </h1>
                  <ShareButton
                    type="profile"
                    userId={user.id}
                    slug={user.slug}
                  />
                  {isOwnProfile && !isPublicView && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`${getCreatorUrl(user)}/edit`}>
                        <Pencil className="h-4 w-4" />
                        <span className="hidden md:inline">
                          {t("editProfile")}
                        </span>
                      </Link>
                    </Button>
                  )}
                  {isLoggedIn && !effectiveIsOwnProfile && (
                    <FollowButton
                      targetUserId={user.id}
                      initialIsFollowing={isFollowingCreator}
                    />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground">
                    {submissionCount}{" "}
                    {submissionCount !== 1 ? t("works") : t("work")}
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
          </div>

          {user.bio && <ExpandableBio html={user.bio} className="mt-4" />}
        </div>
      )}

      {/* Badges Section */}
      {user.badgeAwards && user.badgeAwards.length > 0 && (
        <ProfileBadges badgeAwards={user.badgeAwards} className="mb-8" />
      )}

      {/* Analytics - only visible to profile owner in private view */}
      {effectiveIsOwnProfile && <ProfileAnalytics userId={user.id} />}

      {/* Portfolio Section */}
      {(portfolioItems.length > 0 || featuredSubmission) && (
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {t("portfolio")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("showingTopPortfolioItems", { count: MAX_PORTFOLIO_ITEMS })}
              </p>
            </div>
            <div className="flex flex-row flex-wrap items-end justify-end gap-2">
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`${getCreatorUrl(user)}/portfolio`}
                  data-hint-target="portfolio-link"
                >
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden md:inline">
                    {t("browsePortfolio")}
                  </span>
                </Link>
              </Button>
            </div>
          </div>
          <PortfolioGridProfile
            items={allPortfolioItems
              .slice(0, MAX_PORTFOLIO_ITEMS)
              .map((item) => ({
                ...item,
                imageFocalPoint: item.imageFocalPoint as
                  | { x: number; y: number }
                  | null
                  | undefined,
              }))}
            isLoggedIn={isLoggedIn}
            isOwnProfile={effectiveIsOwnProfile}
            user={
              user
                ? {
                    id: user.id,
                    name: user.name,
                    image: user.image,
                    slug: user.slug,
                  }
                : undefined
            }
            featuredSubmissionId={featuredSubmission?.id}
          />
        </div>
      )}

      {/* Gallery Section - Main Content Area */}
      <div className="w-full min-w-0">
        {allPortfolioItems.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-12 text-center">
            <p className="text-muted-foreground">
              {effectiveIsOwnProfile ? t("noWorkYet") : t("noWorkToDisplay")}
            </p>
            {effectiveIsOwnProfile && (
              <div className="mt-4 flex justify-center gap-3">
                <Link
                  href={`${getCreatorUrl(user)}/portfolio`}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {t("addPortfolioItem")}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Did You Know hints for logged-in users */}
      {session?.user &&
        tutorialData &&
        (() => {
          // Get the next hint to show using the helper
          // The helper looks up hints from centralized config and handles all logic
          // Context is used for conditional hints (e.g., isOwnProfile)
          const nextHint = getNextPageHint(
            tutorialData,
            "profile-view",
            t,
            "profile",
            { isOwnProfile: effectiveIsOwnProfile },
          );

          return nextHint ? (
            <HintPopover
              hintKey={nextHint.key}
              page="profile-view"
              title={nextHint.title}
              description={nextHint.description}
              shouldShow={true}
              order={nextHint.order}
              showArrow={nextHint.showArrow ?? false}
              fixedPosition={nextHint.fixedPosition}
              targetSelector={nextHint.targetSelector}
              side={nextHint.side}
            />
          ) : null;
        })()}
    </PageLayout>
  );
}
