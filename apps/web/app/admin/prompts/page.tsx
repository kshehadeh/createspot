import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { AdminPrompts } from "../admin-prompts";

export const dynamic = "force-dynamic";

export default async function AdminPromptsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/welcome");
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
    <PageLayout maxWidth="max-w-none" className="sm:px-12">
      <AdminPrompts prompts={allPrompts} />
    </PageLayout>
  );
}
