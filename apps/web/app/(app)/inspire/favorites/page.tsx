import Link from "@/components/link";
import { Button } from "@createspot/ui-primitives/button";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { ExhibitionGrid } from "@/app/(app)/inspire/exhibition/exhibition-grid";

async function getFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    include: {
      submission: {
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/welcome");
  }

  const t = await getTranslations("favorites");

  const favorites = await getFavorites(session.user.id);

  // Transform favorites data to match ExhibitionSubmission interface
  const submissions = favorites.map((favorite) => ({
    id: favorite.submission.id,
    title: favorite.submission.title,
    imageUrl: favorite.submission.imageUrl,
    text: favorite.submission.text,
    tags: favorite.submission.tags,
    category: favorite.submission.category,
    createdAt: favorite.submission.createdAt,
    shareStatus: favorite.submission.shareStatus,
    critiquesEnabled: favorite.submission.critiquesEnabled,
    user: favorite.submission.user,
  }));

  return (
    <PageLayout>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {submissions.length > 0 ? (
        <ExhibitionGrid
          submissions={submissions}
          isLoggedIn={true}
          initialHasMore={false}
        />
      ) : (
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">{t("empty")}</p>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full px-8 text-sm font-medium"
          >
            <Link href="/inspire/exhibition">{t("exploreExhibits")}</Link>
          </Button>
        </div>
      )}
    </PageLayout>
  );
}
