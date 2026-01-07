import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { ProfileEditForm } from "./profile-edit-form";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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

  // Fetch all user submissions for the featured piece selector (up to 100)
  const submissions = await prisma.submission.findMany({
    where: { userId: session.user.id },
    include: {
      prompt: {
        select: {
          word1: true,
          word2: true,
          word3: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Fetch portfolio items separately for the portfolio manager
  const portfolioItems = await prisma.submission.findMany({
    where: {
      userId: session.user.id,
      isPortfolio: true,
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

  if (!user) {
    redirect("/");
  }

  return (
    <PageLayout maxWidth="max-w-none" className="w-full">
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
                Edit your profile information
              </p>
            </div>
          </div>
          <Link
            href={`/profile/${user.id}`}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            View Profile
          </Link>
        </div>
      </div>

      <ProfileEditForm
        userId={user.id}
        initialBio={user.bio || ""}
        initialInstagram={user.instagram || ""}
        initialTwitter={user.twitter || ""}
        initialLinkedin={user.linkedin || ""}
        initialWebsite={user.website || ""}
        initialFeaturedSubmissionId={user.featuredSubmissionId || ""}
        submissions={submissions.map((s) => ({
          id: s.id,
          title: s.title,
          imageUrl: s.imageUrl,
          text: s.text,
          wordIndex: s.wordIndex,
          isPortfolio: s.isPortfolio,
          tags: s.tags,
          category: s.category,
          prompt: s.prompt
            ? {
                word1: s.prompt.word1,
                word2: s.prompt.word2,
                word3: s.prompt.word3,
              }
            : null,
        }))}
        portfolioItems={portfolioItems.map((p) => ({
          id: p.id,
          title: p.title,
          imageUrl: p.imageUrl,
          text: p.text,
          isPortfolio: p.isPortfolio,
          portfolioOrder: p.portfolioOrder,
          tags: p.tags,
          category: p.category,
          promptId: p.promptId,
          wordIndex: p.wordIndex,
          prompt: p.prompt
            ? {
                word1: p.prompt.word1,
                word2: p.prompt.word2,
                word3: p.prompt.word3,
              }
            : null,
          _count: {
            favorites: p._count.favorites,
          },
          shareStatus: p.shareStatus,
        }))}
      />
    </PageLayout>
  );
}
