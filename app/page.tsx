import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { SignInButton } from "@/components/auth-button";
import { CreateSpotLogo } from "@/components/create-spot-logo";

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
  const recentWork = await getRecentWork();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Header user={session?.user} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-20 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-rose-50 to-violet-50 dark:from-amber-950/20 dark:via-rose-950/20 dark:to-violet-950/20" />
          <div className="relative mx-auto max-w-4xl">
            <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:items-start lg:text-left">
              <div className="flex-shrink-0 lg:order-2">
                <CreateSpotLogo
                  className="h-40 w-auto sm:h-64 lg:h-56"
                  base="rgb(24 24 27)"
                  highlight="rgb(161 161 170)"
                  sheen
                />
              </div>
              <div className="flex-1 lg:order-1">
                <h1 className="mb-6 text-5xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-7xl">
                  Where creativity
                  <span className="block bg-gradient-to-r from-amber-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">
                    finds its home
                  </span>
                </h1>
                <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400 lg:mx-0">
                  Join a vibrant community of artists and writers. Build your
                  portfolio, share your creative journey, and get inspired by
                  weekly prompts.
                </p>
                <div className="flex flex-wrap justify-center gap-4 lg:justify-start">
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
            </div>
          </div>
        </section>

        {/* Mission Statement Section */}
        <section className="px-6 pb-8 pt-0 sm:pb-12 sm:pt-2">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-2xl leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-3xl sm:leading-relaxed md:text-4xl md:leading-relaxed lg:text-5xl lg:leading-relaxed">
              A place for creatives to{" "}
              <strong className="rainbow-sheen">exhibit their work</strong>,
              find inspiration to{" "}
              <strong className="rainbow-sheen">create more</strong>, and{" "}
              <strong className="rainbow-sheen">support fellow humans</strong>.
            </p>
          </div>
        </section>

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
