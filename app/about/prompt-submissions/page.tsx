import type { Metadata } from "next";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";

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

export default function PromptSubmissionsPage() {
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <section className="mb-12 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          About Prompts
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Build a prompt submission your way.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Each prompt is flexible: share visuals, text, or both, and decide
          what you want the community to see.
        </p>
      </section>

      <div className="grid gap-8">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              What you can submit
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Each submission can include{" "}
              <strong className="text-foreground">
                a visual, text, or both
              </strong>
              . If you upload an image, it becomes the primary visual in the
              gallery. If you submit text without an image, it appears as a text
              card. When you include both, the image leads while the text is
              shown alongside the full submission view.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              Titles in the gallery
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              You can add a{" "}
              <strong className="text-foreground">title</strong>{" "}
              to your submission. That title appears in the gallery and on the
              submission detail page, helping viewers understand your intent at
              a glance.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              Clearing and removing submissions
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              You can{" "}
              <strong className="text-foreground">
                clear all submissions
              </strong>{" "}
              for the current prompt or{" "}
              <strong className="text-foreground">
                remove individual submissions
              </strong>{" "}
              whenever you want to refine what you share. This makes it easy to
              refresh your prompt entries without losing momentum.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/about"
          className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to About
        </Link>
      </div>
    </PageLayout>
  );
}
