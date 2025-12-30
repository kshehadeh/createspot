import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCurrentPrompt, getPromptSubmissions } from "@/lib/prompts";
import { SignInButton } from "@/components/auth-button";
import {
  AnimatedHero,
  AnimatedCta,
  AnimatedGallery,
  AnimatedHowItWorks,
} from "@/components/animated-home";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const prompt = await getCurrentPrompt();
  const submissions = prompt ? await getPromptSubmissions(prompt.id, 6) : [];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between px-6 py-4 sm:px-12">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Wonder Weekly
        </h1>
        <nav className="flex items-center gap-4">
          <Link
            href="/this-week"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Gallery
          </Link>
          {session ? (
            <>
              <Link
                href="/play"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                Play
              </Link>
              {session.user.isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                >
                  Admin
                </Link>
              )}
            </>
          ) : null}
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        {prompt ? (
          <>
            <AnimatedHero words={[prompt.word1, prompt.word2, prompt.word3]} />
            <AnimatedHowItWorks />
            <AnimatedCta isLoggedIn={!!session} />
            {submissions.length > 0 && (
              <AnimatedGallery submissions={submissions} />
            )}
          </>
        ) : (
          <section className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-white">
              Welcome to Wonder Weekly
            </h2>
            <p className="mb-8 text-zinc-600 dark:text-zinc-400">
              No prompt available this week. Check back soon!
            </p>
            {!session && <SignInButton />}
          </section>
        )}
      </main>

      <footer className="px-6 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        &copy; {new Date().getFullYear()} iWonder Designs
      </footer>
    </div>
  );
}
