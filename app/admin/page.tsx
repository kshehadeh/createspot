import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentPrompt } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PromptForm } from "./prompt-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  const currentPrompt = await getCurrentPrompt();
  const recentPrompts = await prisma.prompt.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 sm:px-12">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Users
          </Link>
          <Link
            href="/"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-white">
            {currentPrompt ? "Current Prompt" : "Create New Prompt"}
          </h2>
          <PromptForm prompt={currentPrompt} />
        </section>

        {recentPrompts.length > 0 && (
          <section>
            <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-white">
              Recent Prompts
            </h2>
            <div className="space-y-4">
              {recentPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="mb-2 flex items-center gap-4">
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {prompt.word1}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {prompt.word2}
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      {prompt.word3}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {new Date(prompt.weekStart).toLocaleDateString()} -{" "}
                    {new Date(prompt.weekEnd).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
