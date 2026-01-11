import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCurrentPrompt, getPromptSubmissions } from "@/lib/prompts";
import { PageLayout } from "@/components/page-layout";
import { GalleryGrid } from "./gallery-grid";

export const dynamic = "force-dynamic";

export default async function ThisWeekPage() {
  const session = await auth();
  const prompt = await getCurrentPrompt();
  const submissions = prompt ? await getPromptSubmissions(prompt.id) : [];

  if (!prompt) {
    return (
      <PageLayout className="flex flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          No Active Prompt
        </h1>
        <p className="mb-8 text-muted-foreground">
          There&apos;s no prompt available this week. Check back soon!
        </p>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to Home
        </Link>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="mb-12 text-center">
        <p className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">
          This week&apos;s prompt
        </p>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
          {[prompt.word1, prompt.word2, prompt.word3].map((word, index) => (
            <span
              key={index}
              className={`inline-block text-3xl font-bold leading-[1.3] text-foreground sm:text-5xl sm:leading-[1.3] rainbow-shimmer-${index + 1}`}
            >
              {word}
            </span>
          ))}
        </div>
      </section>

      {submissions.length > 0 ? (
        <GalleryGrid
          submissions={submissions.map((s) => ({
            ...s,
            imageFocalPoint: s.imageFocalPoint as {
              x: number;
              y: number;
            } | null,
          }))}
          words={[prompt.word1, prompt.word2, prompt.word3]}
          isLoggedIn={!!session?.user}
        />
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground">
            No submissions yet. Be the first to share your interpretation!
          </p>
          <Link
            href="/prompt/play"
            className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create a submission
          </Link>
        </div>
      )}
    </PageLayout>
  );
}
