import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { PageLayout } from "@/components/page-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, LayoutGrid, Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  const t = await getTranslations("admin.dashboard");

  const adminCards = [
    {
      id: "prompts",
      title: t("managePrompts"),
      description: t("managePromptsDescription"),
      href: "/admin/prompts",
      icon: Sparkles,
    },
    {
      id: "users",
      title: t("manageUsers"),
      description: t("manageUsersDescription"),
      href: "/admin/users",
      icon: Users,
    },
    {
      id: "exhibits",
      title: t("manageExhibits"),
      description: t("manageExhibitsDescription"),
      href: "/admin/exhibits",
      icon: LayoutGrid,
    },
    {
      id: "notifications",
      title: t("manageNotifications"),
      description: t("manageNotificationsDescription"),
      href: "/admin/notifications",
      icon: Bell,
    },
  ];

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.id}
              className="group transition-all hover:shadow-md"
            >
              <CardHeader>
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                </div>
                <CardDescription className="text-base">
                  {card.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="default">
                  <Link href={card.href}>
                    {t("goTo", { title: card.title })}
                    <span className="ml-2" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageLayout>
  );
}
