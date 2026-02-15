import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { HistoryList } from "./history-list";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const t = await getTranslations("prompt.history");
  const session = await auth();

  if (!session?.user) {
    redirect("/welcome");
  }

  const prompts = await prisma.prompt.findMany({
    where: {
      submissions: {
        some: {
          userId: session.user.id,
        },
      },
    },
    orderBy: { weekStart: "desc" },
    take: 6,
    include: {
      submissions: {
        where: {
          userId: session.user.id,
        },
        orderBy: { wordIndex: "asc" },
      },
    },
  });

  const hasMore = prompts.length > 5;
  const initialItems = hasMore ? prompts.slice(0, 5) : prompts;

  return (
    <PageLayout maxWidth="max-w-5xl">
      <h1 className="mb-8 text-2xl font-semibold text-foreground">
        {t("title")}
      </h1>
      <HistoryList
        initialItems={initialItems.map((p) => ({
          ...p,
          weekStart: p.weekStart.toISOString(),
          weekEnd: p.weekEnd.toISOString(),
        }))}
        initialHasMore={hasMore}
      />
    </PageLayout>
  );
}
