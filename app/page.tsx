import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { SignInButton } from "@/components/auth-button";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Create Spot",
    description:
      "A creative community for artists and writers to share their work, build portfolios, and participate in weekly creative prompts.",
    openGraph: {
      title: "Create Spot",
      description:
        "A creative community for artists and writers to share their work, build portfolios, and participate in weekly creative prompts.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Create Spot",
      description:
        "A creative community for artists and writers to share their work, build portfolios, and participate in weekly creative prompts.",
    },
  };
}

// Get featured artists - users with portfolio items or featured submissions
async function getFeaturedArtists() {
  const artists = await prisma.user.findMany({
    where: {
      OR: [
        { featuredSubmissionId: { not: null } },
        {
          submissions: {
            some: {
              isPortfolio: true,
              shareStatus: "PUBLIC",
            },
          },
        },
      ],
    },
    include: {
      featuredSubmission: true,
      submissions: {
        where: {
          shareStatus: "PUBLIC",
          OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          submissions: {
            where: { shareStatus: "PUBLIC" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return artists;
}

// Get recent public work
async function getRecentWork() {
  return prisma.submission.findMany({
    where: {
      shareStatus: "PUBLIC",
      OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

export default async function Home() {
  const session = await auth();
  const [featuredArtists, recentWork] = await Promise.all([
    getFeaturedArtists(),
    getRecentWork(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Header user={session?.user} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-20 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 dark:from-amber-950/20 dark:via-rose-950/20 dark:to-violet-950/20" />
          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-7xl">
              Where creativity
              <span className="block bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">
                finds its home
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
              Join a vibrant community of artists and writers. Build your
              portfolio, share your creative journey, and get inspired by weekly
              prompts.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {session ? (
                <>
                  <Link
                    href="/profile/edit"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Build Your Portfolio
                  </Link>
                  <Link
                    href="/prompt"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                  >
                    Play Weekly Prompts
                  </Link>
                </>
              ) : (
                <>
                  <SignInButton />
                  <Link
                    href="/prompt/this-week"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white px-8 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
                  >
                    Browse Gallery
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Featured Artists Section */}
        {featuredArtists.length > 0 && (
          <section className="px-6 py-16">
            <div className="mx-auto max-w-6xl">
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    Featured Artists
                  </h2>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    Discover talented creators in our community
                  </p>
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredArtists.map((artist) => {
                  const previewImage =
                    artist.featuredSubmission?.imageUrl ||
                    artist.submissions[0]?.imageUrl;
                  return (
                    <Link
                      key={artist.id}
                      href={`/profile/${artist.id}`}
                      className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                        {previewImage ? (
                          <Image
                            src={previewImage}
                            alt={artist.name || "Artist"}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <svg
                              className="h-16 w-16 text-zinc-300 dark:text-zinc-700"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          {artist.image ? (
                            <Image
                              src={artist.image}
                              alt={artist.name || "Artist"}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                              {artist.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-zinc-900 dark:text-white">
                              {artist.name || "Anonymous"}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {artist._count.submissions} works
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Recent Work Section */}
        {recentWork.length > 0 && (
          <section className="px-6 py-16">
            <div className="mx-auto max-w-6xl">
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    Recent Work
                  </h2>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    Fresh inspiration from the community
                  </p>
                </div>
                <Link
                  href="/prompt/this-week"
                  className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  View all →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {recentWork.map((work) => (
                  <Link
                    key={work.id}
                    href={`/s/${work.id}`}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
                  >
                    {work.imageUrl ? (
                      <Image
                        src={work.imageUrl}
                        alt={work.title || "Creative work"}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : work.text ? (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 p-4 dark:from-zinc-800 dark:to-zinc-900">
                        <p className="line-clamp-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
                          {work.text.replace(/<[^>]*>/g, "").slice(0, 100)}...
                        </p>
                      </div>
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex items-center gap-2">
                        {work.user.image ? (
                          <Image
                            src={work.user.image}
                            alt={work.user.name || "User"}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-medium text-white">
                            {work.user.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <span className="truncate text-sm text-white">
                          {work.user.name || "Anonymous"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Weekly Prompts CTA Section */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-8 sm:p-12">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLThoLTJ2LTRoMnY0em0tOCA4aC0ydi00aDJ2NHptMC04aC0ydi00aDJ2NHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
              <div className="relative text-center">
                <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                  Weekly Creative Prompts
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-lg text-white/80">
                  Challenge yourself with three new words every week. Create
                  something unique, share your interpretation, and see how
                  others bring the same words to life.
                </p>
                <Link
                  href="/prompt/this-week"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-medium text-violet-600 transition-colors hover:bg-zinc-100"
                >
                  See This Week&apos;s Prompt
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        &copy; {new Date().getFullYear()} Create Spot
      </footer>
    </div>
  );
}
