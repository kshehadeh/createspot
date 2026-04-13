import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getFeedSubmissions } from "@/lib/feed";
import { FeedList } from "@/components/feed-list";
import { PublicHomeMobileScrollbar } from "@/components/public-home-mobile-scrollbar";

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
  const [session, t] = await Promise.all([auth(), getTranslations("feed")]);

  const { submissions, hasMore, nextCursor } = await getFeedSubmissions({
    currentUserId: session?.user?.id,
  });

  return (
    <main className="mx-auto w-full max-w-[600px] flex-1 bg-surface py-4">
      <PublicHomeMobileScrollbar />
      <h1 className="sr-only">{t("title")}</h1>
      <FeedList
        initialSubmissions={submissions}
        initialHasMore={hasMore}
        initialNextCursor={nextCursor}
        isLoggedIn={!!session?.user}
        currentUserId={session?.user?.id}
        showActionBar
      />
    </main>
  );
}
