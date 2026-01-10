import type { Metadata } from "next";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";

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

export default function PurposePage() {
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <section className="mb-12 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Why We Create
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Humanity is the point.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          In a world where automation is everywhere, what we make is proof that
          we are still here, still feeling, still paying attention.
        </p>
      </section>

      <div className="grid gap-8">
        <Card className="rounded-3xl border-none bg-linear-to-br from-emerald-50/50 to-white shadow-sm dark:from-emerald-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              Why creation matters now
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              As automation becomes more prevalent, the value of our work is not
              just in output but in{" "}
              <strong className="text-foreground">human meaning</strong>. Our
              perspective, emotion, and lived experience make technology
              worthwhile. The tools can scale, but{" "}
              <strong className="text-foreground">
                our humanity gives it purpose
              </strong>
              .
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-violet-50/50 to-white shadow-sm dark:from-violet-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              Awe keeps us alive
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Awe belongs in everyday life. It is the spark that makes us look
              closer, feel deeper, and{" "}
              <strong className="text-foreground">
                notice what others might miss
              </strong>
              . The things that inspire us are essential, and the{" "}
              <strong className="text-foreground">
                creative output they ignite
              </strong>{" "}
              is just as important.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-none bg-linear-to-br from-indigo-50/50 to-white shadow-sm dark:from-indigo-950/10 dark:to-transparent">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl text-foreground font-permanent-marker">
              The creative cycle
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              <strong className="text-foreground">
                Observation, Awe, Creation
              </strong>{" "}
              is a cycle that makes life worth living. Each feeds the next, and
              the loop gets stronger when we share our work and support each
              other. Let&apos;s keep that cycle going together.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/about"
          className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground underline underline-offset-4 decoration-muted-foreground/30"
        >
          ← Back to About
        </Link>
      </div>
    </PageLayout>
  );
}
