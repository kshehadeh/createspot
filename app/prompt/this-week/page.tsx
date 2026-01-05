import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCurrentPrompt, getPromptSubmissions } from "@/lib/prompts";
import { Header } from "@/components/header";
import { GalleryGrid } from "./gallery-grid";

export const dynamic = "force-dynamic";

export default async function ThisWeekPage() {
  const session = await auth();
  const prompt = await getCurrentPrompt();
  const submissions = prompt ? await getPromptSubmissions(prompt.id) : [];

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Gallery" user={session?.user} />

      <main className="mx-auto max-w-6xl px-6 py-12">
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

        {submissions.length > 0 ? (
          <GalleryGrid
            submissions={submissions}
            words={[prompt.word1, prompt.word2, prompt.word3]}
            isLoggedIn={!!session?.user}
          />
        ) : (
          <div className="text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              No submissions yet. Be the first to share your interpretation!
            </p>
            <Link
              href="/prompt/play"
              className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Create a submission
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
