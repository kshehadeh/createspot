import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { HistoryList } from "./history-list";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const prompts = await prisma.prompt.findMany({
    where: {
      submissions: {
        some: {
          userId: session.user.id,
        },
      },
    },
    orderBy: { weekStart: "desc" },
    take: 11,
    include: {
      submissions: {
        where: {
          userId: session.user.id,
        },
        orderBy: { wordIndex: "asc" },
      },
    },
  });

  const hasMore = prompts.length > 10;
  const initialItems = hasMore ? prompts.slice(0, 10) : prompts;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="History" user={session.user} />

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-white">
          Your Submission History
        </h1>
        <HistoryList
          initialItems={initialItems.map((p) => ({
            ...p,
            weekStart: p.weekStart.toISOString(),
            weekEnd: p.weekEnd.toISOString(),
          }))}
          initialHasMore={hasMore}
        />
      </main>
    </div>
  );
}
