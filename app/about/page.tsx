import type { Metadata } from "next";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";

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

export default function AboutPage() {
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <section className="mb-14 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          About Create Spot
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          A home for creative momentum.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          We built Create Spot to help creatives stay inspired, share their
          work in thoughtful ways, and grow a body of work that feels alive.
        </p>
      </section>

      <div className="grid gap-8">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              Purpose
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Create Spot exists to give creatives{" "}
              <strong className="text-foreground">
                a place to get inspired
              </strong>{" "}
              to create more and{" "}
              <strong className="text-foreground">
                exhibit their work in interesting ways
              </strong>
              . We believe creative energy grows when it is{" "}
              <strong className="text-foreground">
                both sparked and shared
              </strong>
              . Over time, we will keep building{" "}
              <strong className="text-foreground">
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
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              How the site is organized
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Your portfolio is{" "}
              <strong className="text-foreground">
                your personal space
              </strong>
              . You can build it over time,{" "}
              <strong className="text-foreground">
                curate the pieces that represent you best
              </strong>
              , and share the results when you want to be seen. When you submit
              new work, it becomes{" "}
              <strong className="text-foreground">
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
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              Prompt inspiration
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Weekly prompts are designed to{" "}
              <strong className="text-foreground">
                spark momentum
              </strong>
              . Use the three-word prompt to create something new or connect an
              existing portfolio piece that fits the theme. Every prompt
              submission can live in{" "}
              <strong className="text-foreground">
                your portfolio
              </strong>
              , so your inspiration and your body of work{" "}
              <strong className="text-foreground">
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
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
