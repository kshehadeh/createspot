import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { HistoryList } from "@/app/history/history-list";

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
    },
  });

  if (!user) {
    notFound();
  }

  const prompts = await prisma.prompt.findMany({
    where: {
      submissions: {
        some: {
          userId: user.id,
        },
      },
    },
    orderBy: { weekStart: "desc" },
    take: 11,
    include: {
      submissions: {
        where: {
          userId: user.id,
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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Profile" user={session?.user} />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
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
              {submissionCount} submission{submissionCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {initialItems.length > 0 ? (
          <HistoryList
            initialItems={initialItems.map((p) => ({
              ...p,
              weekStart: p.weekStart.toISOString(),
              weekEnd: p.weekEnd.toISOString(),
            }))}
            initialHasMore={hasMore}
            userId={user.id}
          />
        ) : (
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            No submissions yet.
          </p>
        )}
      </main>
    </div>
  );
}
