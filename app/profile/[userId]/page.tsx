import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { HistoryList } from "@/app/prompt/history/history-list";
import { SocialLinks } from "./social-links";
import { ExpandableImage } from "@/components/expandable-image";
import { ExpandableText } from "@/components/expandable-text";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { ProfileAnalytics } from "@/components/profile-analytics";
import { ProfileViewTracker } from "@/components/profile-view-tracker";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  const session = await auth();

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

  // Build share status filter based on ownership
  const shareStatusFilter = isOwnProfile
    ? {} // Owner sees all their items
    : { shareStatus: { in: ["PROFILE" as const, "PUBLIC" as const] } }; // Others see PROFILE and PUBLIC only

  // Fetch portfolio items
  const portfolioItems = await prisma.submission.findMany({
    where: {
      userId: user.id,
      isPortfolio: true,
      ...shareStatusFilter,
    },
    orderBy: { createdAt: "desc" },
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

  const submissionCount = await prisma.submission.count({
    where: { userId: user.id },
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
    (isOwnProfile ||
      featuredSubmissionRaw.shareStatus === "PROFILE" ||
      featuredSubmissionRaw.shareStatus === "PUBLIC")
      ? featuredSubmissionRaw
      : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Profile" user={session?.user} />

      {/* Track profile view for non-owners */}
      {!isOwnProfile && <ProfileViewTracker profileUserId={user.id} />}

      <main className="mx-auto max-w-5xl px-6 py-12">
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
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <span className="text-2xl font-medium text-zinc-600 dark:text-zinc-400">
                    {user.name?.charAt(0) || "?"}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  {user.name || "Anonymous"}
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {submissionCount} work{submissionCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Edit Profile
              </Link>
            )}
          </div>

          {user.bio && (
            <div
              className="prose prose-sm dark:prose-invert mt-4 max-w-none text-zinc-700 dark:text-zinc-300"
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

        {/* Analytics - only visible to profile owner */}
        {isOwnProfile && <ProfileAnalytics userId={user.id} />}

        {/* Featured Submission */}
        {featuredSubmission && (
          <div className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-white">
              Featured
            </h2>
            {(() => {
              const hasImage = !!featuredSubmission.imageUrl;
              const hasText = !!featuredSubmission.text;
              const hasBoth = hasImage && hasText;
              const word =
                featuredSubmission.prompt && featuredSubmission.wordIndex
                  ? [
                      featuredSubmission.prompt.word1,
                      featuredSubmission.prompt.word2,
                      featuredSubmission.prompt.word3,
                    ][featuredSubmission.wordIndex - 1]
                  : null;

              return (
                <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <div
                    className={`${
                      hasBoth ? "md:grid md:grid-cols-3 md:gap-8" : ""
                    }`}
                  >
                    {/* Image section */}
                    {hasImage && (
                      <div
                        className={`${hasBoth ? "md:col-span-2" : "w-full"} ${
                          hasBoth ? "mb-6 md:mb-0" : ""
                        }`}
                      >
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                          <ExpandableImage
                            imageUrl={featuredSubmission.imageUrl!}
                            alt={featuredSubmission.title || word || "Featured"}
                            className="min-h-[300px]"
                          />
                        </div>
                      </div>
                    )}

                    {/* Text section */}
                    {hasText && (
                      <div className={hasBoth ? "md:col-span-1" : "w-full"}>
                        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
                          {featuredSubmission.title && (
                            <h3 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-white">
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
                  </div>

                  {/* Link to full submission */}
                  <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    {featuredSubmission.prompt &&
                      featuredSubmission.wordIndex && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            Prompt:
                          </span>
                          <div className="flex gap-2">
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
                                      ? "text-zinc-900 dark:text-white"
                                      : "text-zinc-400 dark:text-zinc-600"
                                  }`}
                                >
                                  {promptWord}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    {!featuredSubmission.prompt && <div />}
                    <Link
                      href={`/s/${featuredSubmission.id}`}
                      className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                    >
                      View full submission →
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Portfolio Section */}
        {portfolioItems.length > 0 && (
          <div className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
                Portfolio
              </h2>
              {isOwnProfile && (
                <Link
                  href="/profile/edit#portfolio"
                  className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Manage Portfolio →
                </Link>
              )}
            </div>
            <PortfolioGrid
              items={portfolioItems}
              isLoggedIn={isLoggedIn}
              isOwnProfile={isOwnProfile}
            />
          </div>
        )}

        {/* Prompt Submissions Section */}
        {initialItems.length > 0 && (
          <div>
            <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-white">
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
          <div className="rounded-lg border border-dashed border-zinc-300 py-12 text-center dark:border-zinc-700">
            <p className="text-zinc-500 dark:text-zinc-400">
              {isOwnProfile
                ? "You haven't added any work yet. Start by adding portfolio items or submitting to prompts."
                : "No work to display yet."}
            </p>
            {isOwnProfile && (
              <div className="mt-4 flex justify-center gap-3">
                <Link
                  href="/profile/edit#portfolio"
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Add Portfolio Item
                </Link>
                <Link
                  href="/prompt/play"
                  className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Submit to Prompt
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
