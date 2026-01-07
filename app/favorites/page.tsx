import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { FavoritesGrid } from "./favorites-grid";

export const dynamic = "force-dynamic";

async function getFavorites(userId: string) {
  return prisma.favorite.findMany({
    where: { userId },
    include: {
      submission: {
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          prompt: {
            select: { word1: true, word2: true, word3: true },
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
    redirect("/auth/signin");
  }

  const favorites = await getFavorites(session.user.id);

  return (
    <PageLayout>
      <section className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold text-foreground">
          Your Favorites
        </h1>
        <p className="text-muted-foreground">
          Submissions you&apos;ve saved for later
        </p>
      </section>

      {favorites.length > 0 ? (
        <FavoritesGrid favorites={favorites} />
      ) : (
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">
            You haven&apos;t favorited any submissions yet.
          </p>
          <Link
            href="/prompt"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Explore Prompts
          </Link>
        </div>
      )}
    </PageLayout>
  );
}
