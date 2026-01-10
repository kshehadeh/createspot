import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Briefcase, LayoutGrid, Sparkles } from "lucide-react";
import { RecentSubmissionsCarousel } from "@/components/recent-submissions-carousel";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Create Spot",
    description:
      "A creative community for artists and writers to share their work, build portfolios, and participate in weekly creative prompts.",
    openGraph: {
      title: "Create Spot",
      description:
        "A creative community for artists and writers to share their work, build portfolios, and participate in weekly creative prompts.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Create Spot",
      description:
        "A creative community for artists and writers to share their work, build portfolios, and participate in weekly creative prompts.",
    },
  };
}

// Get featured artists - users with portfolio items or featured submissions
// Get recent public work
async function getRecentWork() {
  return prisma.submission.findMany({
    where: {
      shareStatus: "PUBLIC",
      OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

export default async function Home() {
  const session = await auth();
  const recentWork = await getRecentWork();

  type HeroCardId = "exhibits" | "portfolio" | "prompt";

  const heroCardDecor: Record<
    HeroCardId,
    {
      gradient: string;
      orb1: string;
      orb2: string;
      icon: string;
      badge: string;
    }
  > = {
    exhibits: {
      gradient:
        "from-amber-500/12 via-violet-500/10 to-emerald-500/10 dark:from-amber-400/10 dark:via-violet-400/10 dark:to-emerald-400/10",
      orb1: "bg-gradient-to-br from-amber-500/35 to-violet-500/25 dark:from-amber-400/25 dark:to-violet-400/20",
      orb2: "bg-gradient-to-br from-emerald-500/25 to-sky-500/15 dark:from-emerald-400/20 dark:to-sky-400/10",
      icon: "text-foreground/80 dark:text-foreground/80",
      badge:
        "bg-foreground/5 ring-foreground/15 dark:bg-foreground/5 dark:ring-foreground/15",
    },
    prompt: {
      gradient:
        "from-violet-500/12 via-rose-500/10 to-amber-500/10 dark:from-violet-400/10 dark:via-rose-400/10 dark:to-amber-400/10",
      orb1: "bg-gradient-to-br from-violet-500/35 to-rose-500/25 dark:from-violet-400/25 dark:to-rose-400/20",
      orb2: "bg-gradient-to-br from-amber-500/25 to-fuchsia-500/15 dark:from-amber-400/20 dark:to-fuchsia-400/10",
      icon: "text-violet-700 dark:text-violet-300",
      badge:
        "bg-violet-500/10 ring-violet-500/20 dark:bg-violet-400/10 dark:ring-violet-300/20",
    },
    portfolio: {
      gradient:
        "from-sky-500/12 via-emerald-500/10 to-indigo-500/10 dark:from-sky-400/10 dark:via-emerald-400/10 dark:to-indigo-400/10",
      orb1: "bg-gradient-to-br from-sky-500/35 to-emerald-500/25 dark:from-sky-400/25 dark:to-emerald-400/20",
      orb2: "bg-gradient-to-br from-indigo-500/25 to-violet-500/15 dark:from-indigo-400/20 dark:to-violet-400/10",
      icon: "text-sky-700 dark:text-sky-300",
      badge:
        "bg-sky-500/10 ring-sky-500/20 dark:bg-sky-400/10 dark:ring-sky-300/20",
    },
  };

  const descriptions: Record<HeroCardId, string> = {
    exhibits:
      "Explore all exhibits — browse, orbit in 3D, and travel the globe.",
    prompt: "Three words a week. Pick one and create something new.",
    portfolio: "Turn your creative work into a portfolio you can share.",
  };

  const heroCards: Array<{
    id: HeroCardId;
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: "exhibits",
      title: "Exhibits",
      href: "/exhibition",
      icon: LayoutGrid,
    },
    { id: "prompt", title: "Prompts", href: "/prompt", icon: Sparkles },
    ...(session?.user
      ? [
          {
            id: "portfolio" as const,
            title: "Your Portfolio",
            href: "/portfolio/edit",
            icon: Briefcase,
          },
        ]
      : []),
  ];

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-14 sm:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 dark:from-amber-950/20 dark:via-rose-950/20 dark:to-violet-950/20" />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-stretch lg:gap-12">
            {/* Left: Hero content */}
            <div className="flex flex-1 flex-col items-start gap-5 text-left">
              <div className="w-full">
                <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
                  Where{" "}
                  <span className="font-permanent-marker">creativity</span>
                  <span className="block bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">
                    finds its home
                  </span>
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground">
                  A home for photographers, painters, illustrators, writers,
                  sculptors, and anyone else who wants to create. Build your
                  portfolio, share your creative journey, and get inspired by
                  weekly prompts.
                </p>
                <Link
                  href="/about"
                  className="mt-3 inline-block text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Learn more →
                </Link>
              </div>
              <div className="w-full">
                <div
                  className={
                    !session?.user
                      ? "flex flex-wrap justify-start gap-3"
                      : "grid gap-3 grid-cols-1 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]"
                  }
                >
                  {heroCards.map((card) => {
                    const Icon = card.icon;
                    const decor = heroCardDecor[card.id];
                    return (
                      <Link
                        key={`${card.id}:${card.href}`}
                        href={card.href}
                        aria-label={`Open ${card.title}`}
                        className={`block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${!session?.user ? "w-full sm:w-[240px]" : ""}`}
                      >
                        <Card className="group relative h-full overflow-hidden border-border/60 bg-card/70 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-lg">
                          <div
                            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${decor.gradient}`}
                          />
                          <div
                            className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl opacity-70 ${decor.orb1}`}
                          />
                          <div
                            className={`pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full blur-2xl opacity-60 ${decor.orb2}`}
                          />

                          <div className="relative">
                            <CardHeader className="p-4 pb-3">
                              <div className="mb-1 flex items-center gap-3">
                                <span
                                  className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ring-1 ${decor.badge}`}
                                >
                                  <Icon
                                    className={`h-5 w-5 stroke-[1.5] ${decor.icon}`}
                                  />
                                </span>
                                <CardTitle className="whitespace-nowrap text-base sm:text-lg">
                                  {card.title}
                                </CardTitle>
                              </div>
                              <CardDescription className="text-sm">
                                {descriptions[card.id]}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                              <div className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                                Open <span aria-hidden>→</span>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Recent Submissions Carousel (appears below on mobile) */}
            {recentWork.length > 0 && (
              <div className="flex w-full flex-col lg:w-[40%] lg:max-w-md lg:flex-shrink-0">
                <RecentSubmissionsCarousel submissions={recentWork} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mission Statement Section */}
      <section className="px-6 pb-8 pt-0 sm:pb-12 sm:pt-2">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-2xl leading-relaxed text-muted-foreground sm:text-3xl sm:leading-relaxed md:text-4xl md:leading-relaxed lg:text-5xl lg:leading-relaxed">
            A place for creatives to{" "}
            <strong className="rainbow-sheen">exhibit their work</strong>, find
            inspiration to{" "}
            <strong className="rainbow-sheen">create more</strong>, and{" "}
            <strong className="rainbow-sheen">support fellow humans</strong>.
          </p>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Create Spot
      </footer>
    </main>
  );
}
