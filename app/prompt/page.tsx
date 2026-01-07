import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCurrentPrompt } from "@/lib/prompts";
import { Header } from "@/components/header";
import { StyledSignInButton } from "./styled-sign-in-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Weekly Prompts | Create Spot",
  description:
    "Challenge yourself with three new words every week. Create photos, artwork, or writing inspired by the prompts and share your unique interpretation.",
  openGraph: {
    title: "Weekly Prompts | Create Spot",
    description:
      "Challenge yourself with three new words every week. Create photos, artwork, or writing inspired by the prompts.",
    type: "website",
  },
};

export default async function PromptsPage() {
  const session = await auth();
  const currentPrompt = await getCurrentPrompt();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Prompts" user={session?.user} />

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Current Prompt Preview - First thing users see */}
        {currentPrompt && (
          <div className="mb-16">
            <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="mb-4 text-sm uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                This week&apos;s prompt
              </p>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                {[
                  currentPrompt.word1,
                  currentPrompt.word2,
                  currentPrompt.word3,
                ].map((word, index) => (
                  <span
                    key={index}
                    className={`inline-block text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl rainbow-shimmer-${index + 1}`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Start Creating Button - Below Prompts */}
            <div className="flex justify-center">
              {session ? (
                <Link
                  href="/prompt/play"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-violet-600 px-8 text-sm font-medium text-white shadow-lg transition-all hover:bg-violet-500 hover:shadow-xl"
                >
                  Start Creating
                </Link>
              ) : (
                <StyledSignInButton />
              )}
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
            Weekly Creative Challenge
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            Three Words.
            <span className="block text-violet-600 dark:text-violet-400">
              Infinite Possibilities.
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Every week, we share three carefully chosen words. Pick one (or
            more!) and create something unique — a photo, artwork, poem, or
            story. See how others interpret the same words and discover new
            perspectives.
          </p>
        </section>

        {/* How It Works Section */}
        <section className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900 dark:text-white">
            How It Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl dark:bg-amber-900/30">
                1
              </div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">
                Choose a Word
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Each week brings three new words. Pick one that sparks your
                imagination — or challenge yourself with all three!
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-2xl dark:bg-rose-900/30">
                2
              </div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">
                Create Something
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Take a photo, make art, write a story or poem. There&apos;s no
                right or wrong way to interpret the prompt.
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-2xl dark:bg-violet-900/30">
                3
              </div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">
                Share & Discover
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Submit your work to the gallery and see how others brought the
                same words to life. Favorite the ones that inspire you!
              </p>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="mb-16">
          <div className="rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-50 p-8 dark:from-zinc-900 dark:to-zinc-800/50">
            <h2 className="mb-6 text-xl font-bold text-zinc-900 dark:text-white">
              Tips for Getting Started
            </h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="shrink-0 text-violet-600 dark:text-violet-400">
                  ✦
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  <strong className="text-zinc-900 dark:text-white">
                    Think abstractly.
                  </strong>{" "}
                  The word &quot;light&quot; could mean sunlight, feeling
                  light-hearted, or even enlightenment.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 text-violet-600 dark:text-violet-400">
                  ✦
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  <strong className="text-zinc-900 dark:text-white">
                    Combine words.
                  </strong>{" "}
                  Try creating one piece that incorporates multiple prompt words
                  for an extra challenge.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 text-violet-600 dark:text-violet-400">
                  ✦
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  <strong className="text-zinc-900 dark:text-white">
                    Use what you have.
                  </strong>{" "}
                  You don&apos;t need fancy equipment. A phone camera or simple
                  writing is perfect.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 text-violet-600 dark:text-violet-400">
                  ✦
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  <strong className="text-zinc-900 dark:text-white">
                    Add existing work.
                  </strong>{" "}
                  If you have portfolio pieces that fit the prompt, you can link
                  them directly!
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Gallery Link */}
        <section className="text-center">
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">
            Want to see what others have created?
          </p>
          <Link
            href="/prompt/this-week"
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
          >
            Browse the Gallery
          </Link>
        </section>
      </main>
    </div>
  );
}
