import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCurrentPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { SubmissionSlots } from "./submission-slots";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const prompt = await getCurrentPrompt();

  if (!prompt) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
        <h1 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-white">
          No Active Prompt
        </h1>
        <p className="mb-8 text-zinc-600 dark:text-zinc-400">
          There&apos;s no prompt available this week. Check back soon!
        </p>
        <Link
          href="/"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const submissions = await prisma.submission.findMany({
    where: {
      userId: session.user.id,
      promptId: prompt.id,
    },
  });

  const submissionsMap = submissions.reduce(
    (acc, sub) => {
      if (sub.wordIndex !== null) {
        acc[sub.wordIndex] = sub;
      }
      return acc;
    },
    {} as Record<number, (typeof submissions)[0]>,
  );

  // Fetch portfolio items that are NOT already linked to a prompt
  // (so they can be used for this prompt)
  const portfolioItems = await prisma.submission.findMany({
    where: {
      userId: session.user.id,
      isPortfolio: true,
      promptId: null, // Only portfolio-only items
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Play" user={session.user} />

      <main className="relative mx-auto max-w-4xl px-6 py-12">
        {/* CTA Button - Upper Right */}
        <div className="absolute right-6 top-12 z-10">
          <Link
            href="/prompt"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-xl font-semibold text-white shadow-lg transition-all hover:bg-violet-500 hover:shadow-xl dark:bg-violet-500 dark:hover:bg-violet-400 sm:h-auto sm:w-auto sm:gap-2 sm:px-6 sm:py-3 sm:text-base"
          >
            <span className="sm:hidden">?</span>
            <span className="hidden sm:inline">Learn More</span>
            <svg
              className="hidden h-5 w-5 sm:block"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>

        <section className="mb-12 text-center">
          <p className="mb-4 text-sm uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            This week&apos;s prompt
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {[prompt.word1, prompt.word2, prompt.word3].map((word, index) => (
              <span
                key={index}
                className={`inline-block text-3xl font-bold leading-[1.3] text-zinc-900 dark:text-white sm:text-5xl sm:leading-[1.3] rainbow-shimmer-${index + 1}`}
              >
                {word}
              </span>
            ))}
          </div>
        </section>

        <SubmissionSlots
          promptId={prompt.id}
          words={[prompt.word1, prompt.word2, prompt.word3]}
          existingSubmissions={submissionsMap}
          portfolioItems={portfolioItems.map((p) => ({
            id: p.id,
            title: p.title,
            imageUrl: p.imageUrl,
            text: p.text,
            category: p.category,
          }))}
        />
      </main>
    </div>
  );
}
