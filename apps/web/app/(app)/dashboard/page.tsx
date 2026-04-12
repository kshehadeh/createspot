import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { PageLayout } from "@/components/page-layout";
import { Dashboard } from "@/components/dashboard";
import { getCreatorUrl } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return {
    title: t("title"),
  };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const creatorUrl = getCreatorUrl(session.user);
  const portfolioUrl = `${creatorUrl}/portfolio`;
  const critiquesUrl = `${creatorUrl}/critiques`;

  return (
    <div className="dashboard-editorial-page min-h-screen">
      <PageLayout maxWidth="max-w-7xl" className="bg-transparent py-8 md:py-12">
        <Dashboard
          portfolioUrl={portfolioUrl}
          critiquesUrl={critiquesUrl}
          profileUrl={creatorUrl}
          userName={session.user.name ?? null}
        />
      </PageLayout>
    </div>
  );
}
