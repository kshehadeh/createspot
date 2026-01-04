import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
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
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Favorites" user={session.user} />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <section className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-white">
            Your Favorites
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Submissions you&apos;ve saved for later
          </p>
        </section>

        {favorites.length > 0 ? (
          <FavoritesGrid favorites={favorites} />
        ) : (
          <div className="text-center">
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              You haven&apos;t favorited any submissions yet.
            </p>
            <Link
              href="/prompt"
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Explore Prompts
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
