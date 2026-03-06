import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getExhibitionSubmissions } from "@/lib/exhibition";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";
import { HomeGrid } from "@/app/home-grid";
import packageJson from "@/package.json";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home");
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function Home() {
  const [session, t, tFooter, tNav, { submissions, hasMore }] = await Promise.all([
    auth(),
    getTranslations("home"),
    getTranslations("footer"),
    getTranslations("navigation"),
    getExhibitionSubmissions({ skip: 0, take: EXHIBITION_PAGE_SIZE }),
  ]);

  if (session?.user) {
    redirect("/dashboard");
  }

  const initialSubmissions = submissions.map((submission) => ({
    ...submission,
    imageFocalPoint: submission.imageFocalPoint as
      | { x: number; y: number }
      | null
      | undefined,
    tags: submission.tags ?? [],
    category: submission.category ?? null,
  }));

  return (
    <main className="flex min-h-screen flex-col">
      {/* Minimal brand strip */}
      <section className="flex shrink-0 items-center justify-between gap-4 border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t("heroTitle")}{" "}
            <span className="inline-block font-permanent-marker bg-gradient-to-r from-amber-400 via-rose-400 to-violet-400 bg-clip-text text-transparent pr-[0.2em] -mr-[0.2em]">
              {t("heroTitleHighlight")}
            </span>
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {t("heroDescription")}
          </p>
        </div>
        <Link
          href="/welcome"
          className="begin-button shrink-0 rounded-full px-4 py-2 text-sm font-medium text-primary-foreground transition-colors sm:hidden"
        >
          {tNav("jumpIn")}
        </Link>
        <Link
          href="/about"
          className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 hidden sm:inline-flex"
        >
          {t("brandCta")}
        </Link>
      </section>

      {/* Art-first grid */}
      <section className="flex-1 px-4 py-6 sm:px-6">
        <HomeGrid
          initialSubmissions={initialSubmissions}
          initialHasMore={hasMore}
          isLoggedIn={false}
        />
      </section>

      <footer className="shrink-0 border-t border-border/50 px-4 py-6 text-center text-sm text-muted-foreground">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
          <span>
            {tFooter("copyright", { year: new Date().getFullYear() })}
          </span>
          <span className="hidden sm:inline">|</span>
          <Link
            href="/about/terms"
            className="transition-colors hover:text-foreground underline underline-offset-4"
          >
            {tFooter("terms")}
          </Link>
          <span className="hidden sm:inline">|</span>
          <span>{tFooter("version", { version: packageJson.version })}</span>
        </div>
      </footer>
    </main>
  );
}
