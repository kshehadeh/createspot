import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { ConstellationSphere } from "@/components/constellation-sphere";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Constellation Exhibition | Create Spot",
  description:
    "Explore the community gallery in an interactive 3D constellation. Discover creative work from the Create Spot community.",
  openGraph: {
    title: "Constellation Exhibition | Create Spot",
    description:
      "Explore the community gallery in an interactive 3D constellation. Discover creative work from the Create Spot community.",
    type: "website",
  },
};

// Get public submissions for the constellation
async function getConstellationWork() {
  const submissions = await prisma.submission.findMany({
    where: {
      shareStatus: "PUBLIC",
      OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
    },
    select: {
      id: true,
      imageUrl: true,
      text: true,
      title: true,
      wordIndex: true,
      prompt: {
        select: {
          word1: true,
          word2: true,
          word3: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 18,
  });

  return submissions.map((submission) => {
    const promptWord =
      submission.prompt && typeof submission.wordIndex === "number"
        ? [
            submission.prompt.word1,
            submission.prompt.word2,
            submission.prompt.word3,
          ][submission.wordIndex - 1] ?? null
        : null;

    return {
      id: submission.id,
      imageUrl: submission.imageUrl,
      text: submission.text,
      title: submission.title,
      promptWord,
    };
  });
}

export default async function ConstellationExhibitionPage() {
  const session = await auth();
  const constellationWork = await getConstellationWork();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Exhibition" user={session?.user} />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="mb-10 rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-amber-50 p-8 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">
            Constellation
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">
                Explore in 3D
              </h1>
              <p className="mt-3 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
                Navigate through the community gallery in an interactive
                constellation. Drag to rotate and discover creative work from
                prompts and portfolios.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-amber-200/70 bg-white px-4 py-2 text-sm font-medium text-amber-700 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              {constellationWork.length} piece
              {constellationWork.length === 1 ? "" : "s"}
            </div>
          </div>
        </section>

        {constellationWork.length > 0 ? (
          <section className="mb-10">
            <div className="flex flex-col gap-10">
              <ConstellationSphere items={constellationWork} />
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No public work available yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

