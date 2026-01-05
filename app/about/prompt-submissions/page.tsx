import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prompt Submissions | Create Spot",
  description:
    "Learn how prompt submissions work, including text and image options, titles, and how to clear or remove submissions.",
  openGraph: {
    title: "Prompt Submissions | Create Spot",
    description:
      "Learn how prompt submissions work, including text and image options, titles, and how to clear or remove submissions.",
    type: "website",
  },
};

export default async function PromptSubmissionsPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Prompt Submissions" user={session?.user} />

      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <section className="mb-12 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
            About Prompts
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            Build a prompt submission your way.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Each prompt is flexible: share visuals, text, or both, and decide
            what you want the community to see.
          </p>
        </section>

        <div className="grid gap-8">
          <section className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-100/60 p-8 dark:border-rose-900/60 dark:from-rose-950/40 dark:via-zinc-950 dark:to-rose-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              What you can submit
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Each submission can include{" "}
              <strong className="text-zinc-900 dark:text-white">
                a visual, text, or both
              </strong>
              . If you upload an image, it becomes the primary visual in the
              gallery. If you submit text without an image, it appears as a text
              card. When you include both, the image leads while the text is
              shown alongside the full submission view.
            </p>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100/60 p-8 dark:border-amber-900/60 dark:from-amber-950/40 dark:via-zinc-950 dark:to-amber-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              Titles in the gallery
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              You can add a{" "}
              <strong className="text-zinc-900 dark:text-white">title</strong>{" "}
              to your submission. That title appears in the gallery and on the
              submission detail page, helping viewers understand your intent at
              a glance.
            </p>
          </section>

          <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-100/60 p-8 dark:border-sky-900/60 dark:from-sky-950/40 dark:via-zinc-950 dark:to-sky-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              Clearing and removing submissions
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              You can{" "}
              <strong className="text-zinc-900 dark:text-white">
                clear all submissions
              </strong>{" "}
              for the current prompt or{" "}
              <strong className="text-zinc-900 dark:text-white">
                remove individual submissions
              </strong>{" "}
              whenever you want to refine what you share. This makes it easy to
              refresh your prompt entries without losing momentum.
            </p>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/about"
            className="inline-flex items-center text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            ← Back to About
          </Link>
        </div>
      </main>
    </div>
  );
}
