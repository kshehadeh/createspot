import Link from "next/link";
import { redirect } from "next/navigation";
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
import { Sparkles, Users, LayoutGrid } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  const adminCards = [
    {
      id: "prompts",
      title: "Manage Prompts",
      description:
        "Create and manage weekly creative prompts. Set three-word prompts with date ranges and track submissions.",
      href: "/admin/prompts",
      icon: Sparkles,
    },
    {
      id: "users",
      title: "Manage Users",
      description:
        "View and manage user accounts. Monitor user activity and handle account administration tasks.",
      href: "/admin/users",
      icon: Users,
    },
    {
      id: "exhibits",
      title: "Manage Exhibits",
      description:
        "Create and curate exhibits. Organize submissions into themed collections and manage exhibit content.",
      href: "/admin/exhibits",
      icon: LayoutGrid,
    },
  ];

  return (
    <PageLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage prompts, users, and exhibits for the Create Spot community.
        </p>
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
                    Go to {card.title}
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
