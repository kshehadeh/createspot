import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Header } from "@/components/header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portfolios & Sharing | Create Spot",
  description:
    "Learn how sharing levels work, how portfolio links and previews are generated, and how to feature your work on Create Spot.",
  openGraph: {
    title: "Portfolios & Sharing | Create Spot",
    description:
      "Learn how sharing levels work, how portfolio links and previews are generated, and how to feature your work on Create Spot.",
    type: "website",
  },
};

export default async function PortfoliosAndSharingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Portfolios & Sharing" user={session?.user} />

      <main className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <section className="mb-12 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
            About Portfolios
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            Share your work with the right audience.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Portfolios let you collect your work, control visibility, and share
            links with confidence. Here&apos;s how the system works in detail.
          </p>
        </section>

        <div className="grid gap-8">
          <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 p-8 dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-emerald-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              Sharing levels
            </h2>
            <p className="mb-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Every portfolio item uses a share status so you can decide{" "}
              <strong className="text-zinc-900 dark:text-white">
                who gets to see it
              </strong>
              .
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-200/70 bg-white/70 p-4 text-sm text-zinc-700 dark:border-emerald-900/60 dark:bg-zinc-900/60 dark:text-zinc-300">
                <p className="font-semibold text-zinc-900 dark:text-white">
                  Private
                </p>
                <p className="mt-1">
                  Only you can see it in your profile editor.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200/70 bg-white/70 p-4 text-sm text-zinc-700 dark:border-emerald-900/60 dark:bg-zinc-900/60 dark:text-zinc-300">
                <p className="font-semibold text-zinc-900 dark:text-white">
                  Profile
                </p>
                <p className="mt-1">
                  Visible on your public profile, but not in galleries.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-200/70 bg-white/70 p-4 text-sm text-zinc-700 dark:border-emerald-900/60 dark:bg-zinc-900/60 dark:text-zinc-300">
                <p className="font-semibold text-zinc-900 dark:text-white">
                  Public
                </p>
                <p className="mt-1">
                  Visible on your profile and in public galleries.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Note: if you link a portfolio item to a prompt, it becomes{" "}
              <strong className="text-zinc-900 dark:text-white">public</strong>{" "}
              so it can appear with other prompt submissions.
            </p>
          </section>

          <section className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-sky-100/60 p-8 dark:border-sky-900/60 dark:from-sky-950/40 dark:via-zinc-950 dark:to-sky-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              Portfolio links and preview images
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Your public portfolio lives at{" "}
              <strong className="text-zinc-900 dark:text-white">
                /profile/your-id
              </strong>
              , and each individual piece has its own shareable link at{" "}
              <strong className="text-zinc-900 dark:text-white">/s/id</strong>.
              When you share your profile link, we automatically generate a
              preview image that highlights your work. If you have a featured
              image that is shareable, it becomes the preview. Otherwise we
              build a grid from your most recent portfolio images.
            </p>
          </section>

          <section className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-violet-100/60 p-8 dark:border-violet-900/60 dark:from-violet-950/40 dark:via-zinc-950 dark:to-violet-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              Featured work
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              You can select a{" "}
              <strong className="text-zinc-900 dark:text-white">
                featured submission
              </strong>{" "}
              in your profile settings to spotlight a single piece at the top of
              your profile. Featured work also powers your profile preview image
              as long as it is set to{" "}
              <strong className="text-zinc-900 dark:text-white">Profile</strong>{" "}
              or{" "}
              <strong className="text-zinc-900 dark:text-white">Public</strong>.
            </p>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-100/60 p-8 dark:border-amber-900/60 dark:from-amber-950/40 dark:via-zinc-950 dark:to-amber-900/30">
            <h2 className="mb-3 text-2xl font-semibold text-zinc-900 dark:text-white">
              Prompts and portfolios together
            </h2>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Prompt submissions can be added to your portfolio, and portfolio
              pieces can be linked to prompts. This keeps your weekly
              inspiration connected to your long-term body of work while
              maintaining a single, consistent archive.
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
