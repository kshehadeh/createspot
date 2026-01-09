import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCurrentPrompt } from "@/lib/prompts";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <PageLayout maxWidth="max-w-4xl">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Three Words.
          <span className="block text-violet-600 dark:text-violet-400">
            Infinite Possibilities.
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
          Every week, we share three carefully chosen words. Pick one (or more!)
          and create something unique — a photo, artwork, poem, or story. See
          how others interpret the same words and discover new perspectives.
        </p>
      </section>

      {/* Current Prompt Preview - Just above How It Works */}
      {currentPrompt && (
        <div className="mb-16">
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="mb-4 text-sm uppercase tracking-widest text-muted-foreground">
                This week&apos;s prompt
              </p>
              <div className="mb-6 flex flex-wrap justify-center gap-4 sm:gap-8">
                {[
                  currentPrompt.word1,
                  currentPrompt.word2,
                  currentPrompt.word3,
                ].map((word, index) => (
                  <span
                    key={index}
                    className={`inline-block text-3xl font-bold text-foreground sm:text-4xl rainbow-shimmer-${index + 1}`}
                  >
                    {word}
                  </span>
                ))}
              </div>
              {/* Start Creating Button - Below Words */}
              <div className="flex justify-center">
                {session ? (
                  <Button asChild>
                    <Link href="/prompt/play">Start Creating</Link>
                  </Button>
                ) : (
                  <StyledSignInButton />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* How It Works Section */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
          How It Works
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="rounded-xl">
            <CardContent className="p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl dark:bg-amber-900/30">
                1
              </div>
              <h3 className="mb-2 font-semibold text-foreground">
                Choose a Word
              </h3>
              <p className="text-sm text-muted-foreground">
                Each week brings three new words. Pick one that sparks your
                imagination — or challenge yourself with all three!
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-2xl dark:bg-rose-900/30">
                2
              </div>
              <h3 className="mb-2 font-semibold text-foreground">
                Create Something
              </h3>
              <p className="text-sm text-muted-foreground">
                Take a photo, make art, write a story or poem. There&apos;s no
                right or wrong way to interpret the prompt.
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-6 text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-2xl dark:bg-violet-900/30">
                3
              </div>
              <h3 className="mb-2 font-semibold text-foreground">
                Share & Discover
              </h3>
              <p className="text-sm text-muted-foreground">
                Submit your work to the gallery and see how others brought the
                same words to life. Favorite the ones that inspire you!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tips Section */}
      <section className="mb-16">
        <div className="rounded-2xl bg-gradient-to-br from-muted to-muted/50 p-8">
          <h2 className="mb-6 text-xl font-bold text-foreground">
            Tips for Getting Started
          </h2>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="shrink-0 text-violet-600 dark:text-violet-400">
                ✦
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">Think abstractly.</strong>{" "}
                The word &quot;light&quot; could mean sunlight, feeling
                light-hearted, or even enlightenment.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-violet-600 dark:text-violet-400">
                ✦
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">Combine words.</strong> Try
                creating one piece that incorporates multiple prompt words for
                an extra challenge.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-violet-600 dark:text-violet-400">
                ✦
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">Use what you have.</strong>{" "}
                You don&apos;t need fancy equipment. A phone camera or simple
                writing is perfect.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 text-violet-600 dark:text-violet-400">
                ✦
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">Add existing work.</strong>{" "}
                If you have portfolio pieces that fit the prompt, you can link
                them directly!
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Gallery Link */}
      <section className="text-center">
        <p className="mb-4 text-muted-foreground">
          Want to see what others have created?
        </p>
        <Link
          href="/prompt/this-week"
          className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Browse the Gallery
        </Link>
      </section>
    </PageLayout>
  );
}
