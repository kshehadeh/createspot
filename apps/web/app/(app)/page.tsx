import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import {
  getFeedSubmissions,
  getFollowingFeedSubmissionsCursor,
  getFavoritesFeedSubmissionsCursor,
} from "@/lib/feed";
import { FeedList } from "@/components/feed-list";
import { PublicHomeMobileScrollbar } from "@/components/public-home-mobile-scrollbar";
import { QuickSubmissionComposer } from "@/components/quick-submission-composer";

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

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, t] = await Promise.all([auth(), getTranslations("feed")]);

  const resolvedSearchParams = (await searchParams) ?? {};
  const tabParam = resolvedSearchParams.tab;
  const tab = Array.isArray(tabParam) ? tabParam[0] : tabParam;

  if (tab === "favorites" && !session?.user?.id) {
    redirect("/welcome");
  }

  const feedType: "home" | "following" | "favorites" =
    tab === "following"
      ? "following"
      : tab === "favorites"
        ? "favorites"
        : "home";

  const { submissions, hasMore, nextCursor } =
    feedType === "favorites" && session?.user?.id
      ? await getFavoritesFeedSubmissionsCursor({
          userId: session.user.id,
        })
      : feedType === "following" && session?.user?.id
        ? await getFollowingFeedSubmissionsCursor({
            currentUserId: session.user.id,
          })
        : await getFeedSubmissions({
            currentUserId: session?.user?.id,
          });

  return (
    <main className="mx-auto w-full max-w-[600px] flex-1 bg-surface py-4">
      <PublicHomeMobileScrollbar />
      <h1 className="sr-only">{t("title")}</h1>
      {session?.user?.id && (
        <div className="px-4">
          <QuickSubmissionComposer />
        </div>
      )}
      <div className="mb-4 px-4">
        <nav
          aria-label={t("title")}
          className="flex items-center justify-between border-b border-border"
        >
          <div className="flex gap-6">
            <Link
              href="/"
              aria-current={feedType === "home" ? "page" : undefined}
              className={[
                "pb-3 text-sm font-medium transition-colors",
                feedType === "home"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {t("home")}
            </Link>
            <Link
              href="/?tab=following"
              aria-current={feedType === "following" ? "page" : undefined}
              className={[
                "pb-3 text-sm font-medium transition-colors",
                feedType === "following"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {t("following")}
            </Link>
            {session?.user?.id && (
              <Link
                href="/?tab=favorites"
                aria-current={feedType === "favorites" ? "page" : undefined}
                className={[
                  "pb-3 text-sm font-medium transition-colors",
                  feedType === "favorites"
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {t("favoritesTab")}
              </Link>
            )}
          </div>
          <div aria-hidden className="pb-3" />
        </nav>
      </div>
      <FeedList
        initialSubmissions={submissions}
        initialHasMore={hasMore}
        initialNextCursor={nextCursor}
        isLoggedIn={!!session?.user}
        currentUserId={session?.user?.id}
        feedType={feedType}
      />
    </main>
  );
}
