import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About | Create Spot",
  description:
    "Learn why Create Spot exists, how portfolios and sharing work, and how weekly prompts connect to your creative journey.",
  openGraph: {
    title: "About | Create Spot",
    description:
      "Learn why Create Spot exists, how portfolios and sharing work, and how weekly prompts connect to your creative journey.",
    type: "website",
  },
};

export default async function AboutPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="About" user={session?.user} />

      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <section className="mb-14 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
            About Create Spot
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            A home for creative momentum.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            We built Create Spot to help creatives stay inspired, share their
            work in thoughtful ways, and grow a body of work that feels alive.
          </p>
        </section>

        <div className="grid gap-8">
          <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100/60 p-8 dark:border-amber-900/60 dark:from-amber-950/40 dark:via-zinc-950 dark:to-amber-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              Purpose
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Create Spot exists to give creatives{" "}
              <strong className="text-zinc-900 dark:text-white">
                a place to get inspired
              </strong>{" "}
              to create more and{" "}
              <strong className="text-zinc-900 dark:text-white">
                exhibit their work in interesting ways
              </strong>
              . We believe creative energy grows when it is{" "}
              <strong className="text-zinc-900 dark:text-white">
                both sparked and shared
              </strong>
              . Over time, we will keep building{" "}
              <strong className="text-zinc-900 dark:text-white">
                new ways to inspire and new ways to share
              </strong>{" "}
              so your practice stays fresh.
            </p>
            <div className="mt-5">
              <Link
                href="/about/purpose"
                className="inline-flex items-center text-sm font-medium text-amber-700 transition-colors hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-200"
              >
                Read more about our purpose →
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-100/60 p-8 dark:border-rose-900/60 dark:from-rose-950/40 dark:via-zinc-950 dark:to-rose-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              How the site is organized
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Your portfolio is{" "}
              <strong className="text-zinc-900 dark:text-white">
                your personal space
              </strong>
              . You can build it over time,{" "}
              <strong className="text-zinc-900 dark:text-white">
                curate the pieces that represent you best
              </strong>
              , and share the results when you want to be seen. When you submit
              new work, it becomes{" "}
              <strong className="text-zinc-900 dark:text-white">
                part of your portfolio
              </strong>{" "}
              and can be shared publicly through the exhibitions and galleries.
            </p>
            <div className="mt-5">
              <Link
                href="/about/portfolios-and-sharing"
                className="inline-flex items-center text-sm font-medium text-rose-700 transition-colors hover:text-rose-900 dark:text-rose-300 dark:hover:text-rose-200"
              >
                Learn more about portfolios and sharing →
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-100/60 p-8 dark:border-sky-900/60 dark:from-sky-950/40 dark:via-zinc-950 dark:to-sky-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              Prompt inspiration
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Weekly prompts are designed to{" "}
              <strong className="text-zinc-900 dark:text-white">
                spark momentum
              </strong>
              . Use the three-word prompt to create something new or connect an
              existing portfolio piece that fits the theme. Every prompt
              submission can live in{" "}
              <strong className="text-zinc-900 dark:text-white">
                your portfolio
              </strong>
              , so your inspiration and your body of work{" "}
              <strong className="text-zinc-900 dark:text-white">
                stay connected
              </strong>
              .
            </p>
            <div className="mt-5">
              <Link
                href="/about/prompt-submissions"
                className="inline-flex items-center text-sm font-medium text-sky-700 transition-colors hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-200"
              >
                Learn more about prompt submissions →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
