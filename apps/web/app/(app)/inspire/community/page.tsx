import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { PageLayout } from "@/components/page-layout";
import { InspirePageHeader } from "@/components/inspire-page-header";
import { CommunityTabs } from "@/app/(app)/inspire/community/community-tabs";

export default async function CommunityPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/welcome");
  }

  const t = await getTranslations("community");

  return (
    <PageLayout>
      <InspirePageHeader title={t("title")} subtitle={t("subtitle")} />
      <CommunityTabs />
    </PageLayout>
  );
}
