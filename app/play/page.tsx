import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCurrentPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
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
      acc[sub.wordIndex] = sub;
      return acc;
    },
    {} as Record<number, (typeof submissions)[0]>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 sm:px-12">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Play
        </h1>
        <Link
          href="/"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          Back to Home
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="mb-12 text-center">
          <p className="mb-4 text-sm uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            This week&apos;s prompt
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {[prompt.word1, prompt.word2, prompt.word3].map((word, index) => (
              <span
                key={index}
                className="text-3xl font-bold text-zinc-900 dark:text-white sm:text-5xl"
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
        />
      </main>
    </div>
  );
}
