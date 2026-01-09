import type { Metadata } from "next";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ExhibitionType } from "@/lib/exhibition-constants";
import { EXHIBITION_CONFIGS } from "@/lib/exhibition-constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Exhibits | Create Spot",
  description:
    "Explore Create Spot exhibits: browse the Gallery, explore the Constellation in 3D, or discover artists worldwide on the Global map.",
  openGraph: {
    title: "Exhibits | Create Spot",
    description:
      "Explore Create Spot exhibits: browse the Gallery, explore the Constellation in 3D, or discover artists worldwide on the Global map.",
    type: "website",
  },
};

const EXHIBIT_DESCRIPTIONS: Record<ExhibitionType, string> = {
  gallery:
    "Browse public work from the Create Spot community. Filter by category or tag, or search by keyword to find your next source of inspiration.",
  constellation:
    "Explore the community gallery in an interactive 3D constellation. Discover creative work from the Create Spot community.",
  global:
    "Explore artists from around the world on an interactive map. Discover creative work from the Create Spot community across the globe.",
};

const EXHIBIT_DECOR: Record<
  ExhibitionType,
  {
    gradient: string;
    orb1: string;
    orb2: string;
    icon: string;
    badge: string;
  }
> = {
  gallery: {
    gradient:
      "from-amber-500/15 via-rose-500/10 to-violet-500/10 dark:from-amber-400/10 dark:via-rose-400/10 dark:to-violet-400/10",
    orb1: "bg-gradient-to-br from-amber-500/40 to-rose-500/30 dark:from-amber-400/30 dark:to-rose-400/20",
    orb2: "bg-gradient-to-br from-violet-500/25 to-fuchsia-500/20 dark:from-violet-400/20 dark:to-fuchsia-400/15",
    icon: "text-amber-700 dark:text-amber-300",
    badge:
      "bg-amber-500/10 ring-amber-500/20 dark:bg-amber-400/10 dark:ring-amber-300/20",
  },
  constellation: {
    gradient:
      "from-indigo-500/12 via-violet-500/12 to-fuchsia-500/10 dark:from-indigo-400/10 dark:via-violet-400/10 dark:to-fuchsia-400/10",
    orb1: "bg-gradient-to-br from-violet-500/35 to-indigo-500/25 dark:from-violet-400/25 dark:to-indigo-400/20",
    orb2: "bg-gradient-to-br from-fuchsia-500/25 to-sky-500/15 dark:from-fuchsia-400/20 dark:to-sky-400/10",
    icon: "text-violet-700 dark:text-violet-300",
    badge:
      "bg-violet-500/10 ring-violet-500/20 dark:bg-violet-400/10 dark:ring-violet-300/20",
  },
  global: {
    gradient:
      "from-emerald-500/12 via-cyan-500/10 to-sky-500/10 dark:from-emerald-400/10 dark:via-cyan-400/10 dark:to-sky-400/10",
    orb1: "bg-gradient-to-br from-emerald-500/35 to-cyan-500/25 dark:from-emerald-400/25 dark:to-cyan-400/20",
    orb2: "bg-gradient-to-br from-sky-500/25 to-indigo-500/15 dark:from-sky-400/20 dark:to-indigo-400/10",
    icon: "text-emerald-700 dark:text-emerald-300",
    badge:
      "bg-emerald-500/10 ring-emerald-500/20 dark:bg-emerald-400/10 dark:ring-emerald-300/20",
  },
};

export default async function ExhibitionHomePage() {
  const exhibits = Object.entries(EXHIBITION_CONFIGS) as Array<
    [ExhibitionType, (typeof EXHIBITION_CONFIGS)[ExhibitionType]]
  >;

  return (
    <PageLayout maxWidth="max-w-6xl">
      <section className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Exhibits
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Three ways to explore the community’s work — browse, orbit, and
          travel.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exhibits.map(([type, config]) => {
          const Icon = config.icon;
          const decor = EXHIBIT_DECOR[type];

          return (
            <Link
              key={type}
              href={config.path}
              aria-label={`Open ${config.name} exhibit`}
              className="block rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card className="group relative h-full overflow-hidden border-border/60 bg-card/70 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card hover:shadow-lg">
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${decor.gradient}`}
                />
                <div
                  className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl opacity-70 ${decor.orb1}`}
                />
                <div
                  className={`pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full blur-2xl opacity-60 ${decor.orb2}`}
                />

                <div className="relative">
                  <CardHeader className="pb-3">
                    <div className="mb-2 flex items-center gap-3">
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${decor.badge}`}
                      >
                        <Icon className={`h-5 w-5 ${decor.icon}`} />
                      </span>
                      <CardTitle className="text-xl">{config.name}</CardTitle>
                    </div>
                    <CardDescription>
                      {EXHIBIT_DESCRIPTIONS[type]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="inline-flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors group-hover:text-foreground">
                      View exhibit <span aria-hidden>→</span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          );
        })}
      </section>
    </PageLayout>
  );
}
