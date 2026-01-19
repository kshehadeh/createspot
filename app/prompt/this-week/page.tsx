import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getCurrentPrompt, getPromptSubmissions } from "@/lib/prompts";
import { PageLayout } from "@/components/page-layout";
import { ThisWeekContent } from "./this-week-content";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";

export const dynamic = "force-dynamic";

export default async function ThisWeekPage() {
  const t = await getTranslations("prompt.thisWeek");
  const session = await auth();
  const prompt = await getCurrentPrompt();
  const { submissions, hasMore } = prompt
    ? await getPromptSubmissions(prompt.id, {
        skip: 0,
        take: EXHIBITION_PAGE_SIZE,
      })
    : { submissions: [], hasMore: false };

  if (!prompt) {
    return (
      <PageLayout className="flex flex-col items-center justify-center text-center">
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          {t("noActivePrompt")}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {t("noActivePromptDescription")}
        </p>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("backToHome")}
        </Link>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="mb-12 text-center">
        <p className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">
          {t("thisWeekPrompt")}
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
        <ThisWeekContent
          initialSubmissions={submissions.map((s) => ({
            ...s,
            imageFocalPoint: s.imageFocalPoint as {
              x: number;
              y: number;
            } | null,
            tags: s.tags || [],
            category: s.category || null,
          }))}
          promptId={prompt.id}
          words={[prompt.word1, prompt.word2, prompt.word3]}
          isLoggedIn={!!session?.user}
          initialHasMore={hasMore}
        />
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground">{t("noSubmissionsYet")}</p>
          <Link
            href="/prompt/play"
            className="mt-4 inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("createSubmission")}
          </Link>
        </div>
      )}
    </PageLayout>
  );
}
