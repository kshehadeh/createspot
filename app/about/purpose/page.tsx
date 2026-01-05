import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Purpose | Create Spot",
  description:
    "Why creative work matters in an automated world, and how observation, awe, and creation keep us human.",
  openGraph: {
    title: "Purpose | Create Spot",
    description:
      "Why creative work matters in an automated world, and how observation, awe, and creation keep us human.",
    type: "website",
  },
};

export default async function PurposePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Purpose" user={session?.user} />

      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <section className="mb-12 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
            Why We Create
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            Humanity is the point.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            In a world where automation is everywhere, what we make is proof
            that we are still here, still feeling, still paying attention.
          </p>
        </section>

        <div className="grid gap-8">
          <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100/60 p-8 dark:border-amber-900/60 dark:from-amber-950/40 dark:via-zinc-950 dark:to-amber-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              Why creation matters now
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              As automation becomes more prevalent, the value of our work is not
              just in output but in{" "}
              <strong className="text-zinc-900 dark:text-white">
                human meaning
              </strong>
              . Our perspective, emotion, and lived experience make technology
              worthwhile. The tools can scale, but{" "}
              <strong className="text-zinc-900 dark:text-white">
                our humanity gives it purpose
              </strong>
              .
            </p>
          </section>

          <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-100/60 p-8 dark:border-sky-900/60 dark:from-sky-950/40 dark:via-zinc-950 dark:to-sky-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              Awe keeps us alive
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Awe belongs in everyday life. It is the spark that makes us look
              closer, feel deeper, and{" "}
              <strong className="text-zinc-900 dark:text-white">
                notice what others might miss
              </strong>
              . The things that inspire us are essential, and the{" "}
              <strong className="text-zinc-900 dark:text-white">
                creative output they ignite
              </strong>{" "}
              is just as important.
            </p>
          </section>

          <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-violet-100/60 p-8 dark:border-violet-900/60 dark:from-violet-950/40 dark:via-zinc-950 dark:to-violet-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              The creative cycle
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              <strong className="text-zinc-900 dark:text-white">
                Observation, Awe, Creation
              </strong>{" "}
              is a cycle that makes life worth living. Each feeds the next, and
              the loop gets stronger when we share our work and support each
              other. Let&apos;s keep that cycle going together.
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
