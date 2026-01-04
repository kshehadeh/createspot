import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
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
    orderBy: { createdAt: "desc" },
  });

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Edit Profile" user={session?.user} />

      <main className="mx-auto max-w-2xl px-6 py-12">
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
                  Edit your profile information
                </p>
              </div>
            </div>
            <Link
              href={`/profile/${user.id}`}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
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
            tags: p.tags,
            category: p.category,
            promptId: p.promptId,
            shareStatus: p.shareStatus,
          }))}
        />
      </main>
    </div>
  );
}
