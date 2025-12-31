import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Header } from "@/components/header";
import { AdminPrompts } from "./admin-prompts";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  const allPrompts = await prisma.prompt.findMany({
    orderBy: { weekStart: "desc" },
    include: {
      _count: {
        select: { submissions: true },
      },
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header title="Admin">
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
      </Header>

      <main className="px-6 py-12 sm:px-12">
        <AdminPrompts prompts={allPrompts} />
      </main>
    </div>
  );
}
