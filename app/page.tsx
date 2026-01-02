import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getCurrentPrompt, getPromptSubmissions } from "@/lib/prompts";
import { SignInButton } from "@/components/auth-button";
import { Header } from "@/components/header";
import {
  AnimatedHero,
  AnimatedCta,
  AnimatedGallery,
  AnimatedHowItWorks,
} from "@/components/animated-home";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Prompts",
    description:
      "A weekly creative prompt community. Share photos, artwork, and text inspired by three-word prompts.",
    openGraph: {
      title: "Prompts",
      description:
        "A weekly creative prompt community. Share photos, artwork, and text inspired by three-word prompts.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Prompts",
      description:
        "A weekly creative prompt community. Share photos, artwork, and text inspired by three-word prompts.",
    },
  };
}

export default async function Home() {
  const session = await auth();
  const prompt = await getCurrentPrompt();
  const submissions = prompt ? await getPromptSubmissions(prompt.id, 6) : [];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <Header user={session?.user} />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        {prompt ? (
          <>
            <AnimatedHero words={[prompt.word1, prompt.word2, prompt.word3]} />
            <AnimatedHowItWorks />
            <AnimatedCta isLoggedIn={!!session} />
            {submissions.length > 0 && (
              <AnimatedGallery
                submissions={submissions}
                words={[prompt.word1, prompt.word2, prompt.word3]}
              />
            )}
          </>
        ) : (
          <section className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-white">
              Welcome to Prompts
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
