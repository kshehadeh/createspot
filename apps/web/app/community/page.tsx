import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { CommunityTabs } from "@/app/community/community-tabs";
import { getFollowingFeedSubmissions } from "@/lib/community";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/welcome");
  }

  const t = await getTranslations("community");
  const { submissions, hasMore } = await getFollowingFeedSubmissions({
    userId: session.user.id,
    take: EXHIBITION_PAGE_SIZE,
  });

  return (
    <PageLayout>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <CommunityTabs
        recentSubmissions={submissions}
        recentHasMore={hasMore}
      />
    </PageLayout>
  );
}
