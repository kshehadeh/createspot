import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCurrentPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
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
      <PageLayout
        maxWidth="max-w-4xl"
        className="flex flex-col items-center justify-center text-center"
      >
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
    <PageLayout maxWidth="max-w-none" className="relative w-full">
      <section className="mb-12 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            This week&apos;s prompt
          </p>
          <Link
            href="/prompt"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Learn more →
          </Link>
        </div>
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
    </PageLayout>
  );
}
