import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { PageLayout } from "@/components/page-layout";
import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/welcome");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  const t = await getTranslations("admin.users");

  return (
    <PageLayout maxWidth="max-w-5xl">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">
            {t("pageTitle")}
          </h2>
        </div>
        <UsersTable currentUserId={session.user.id} />
      </section>
    </PageLayout>
  );
}
