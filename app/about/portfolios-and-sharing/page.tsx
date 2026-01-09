import type { Metadata } from "next";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { Card, CardContent } from "@/components/ui/card";

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

export default function PortfoliosAndSharingPage() {
  return (
    <PageLayout maxWidth="max-w-5xl" className="sm:py-16">
      <section className="mb-12 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          About Portfolios
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Share your work with the right audience.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Portfolios let you collect your work, control visibility, and share
          links with confidence. Here&apos;s how the system works in detail.
        </p>
      </section>

      <div className="grid gap-8">
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              Sharing levels
            </h2>
            <p className="mb-4 text-base leading-relaxed text-muted-foreground">
              Every portfolio item uses a share status so you can decide{" "}
              <strong className="text-foreground">who gets to see it</strong>.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Private</p>
                <p className="mt-1">
                  Only you can see it in your profile editor.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Profile</p>
                <p className="mt-1">
                  Visible on your public profile, but not in galleries.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Public</p>
                <p className="mt-1">
                  Visible on your profile and in public galleries.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Note: if you link a portfolio item to a prompt, it becomes{" "}
              <strong className="text-foreground">public</strong> so it can
              appear with other prompt submissions.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              Portfolio links and preview images
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Your public portfolio lives at{" "}
              <strong className="text-foreground">/profile/your-id</strong>, and
              each individual piece has its own shareable link at{" "}
              <strong className="text-foreground">/s/id</strong>. When you share
              your profile link, we automatically generate a preview image that
              highlights your work. If you have a featured image that is
              shareable, it becomes the preview. Otherwise we build a grid from
              your most recent portfolio images.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              Featured work
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              You can select a{" "}
              <strong className="text-foreground">featured submission</strong>{" "}
              in your profile settings to spotlight a single piece at the top of
              your profile. Featured work also powers your profile preview image
              as long as it is set to{" "}
              <strong className="text-foreground">Profile</strong> or{" "}
              <strong className="text-foreground">Public</strong>.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-8">
            <h2 className="mb-3 text-2xl font-semibold text-foreground">
              Prompts and portfolios together
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Prompt submissions can be added to your portfolio, and portfolio
              pieces can be linked to prompts. This keeps your weekly
              inspiration connected to your long-term body of work while
              maintaining a single, consistent archive.
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
