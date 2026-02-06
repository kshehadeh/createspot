import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { UsersList } from "./users-list";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/welcome");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  const t = await getTranslations("admin.users");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      isAdmin: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PageLayout maxWidth="max-w-5xl">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("title", { count: users.length })}
          </h2>
        </div>
        <UsersList users={users} currentUserId={session.user.id} />
      </section>
    </PageLayout>
  );
}
