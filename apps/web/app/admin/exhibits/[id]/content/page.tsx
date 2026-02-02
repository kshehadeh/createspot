import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { ExhibitContentManager } from "../../exhibit-content-manager";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface ExhibitContentPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExhibitContentPage({
  params,
}: ExhibitContentPageProps) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  const { id: exhibitId } = await params;

  const exhibit = await prisma.exhibit.findUnique({
    where: { id: exhibitId },
  });

  if (!exhibit) {
    redirect("/admin/exhibits");
  }

  const t = await getTranslations("admin.exhibits");

  const exhibitSubmissions = await prisma.exhibitSubmission.findMany({
    where: { exhibitId },
    include: {
      submission: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          prompt: {
            select: {
              word1: true,
              word2: true,
              word3: true,
            },
          },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  const submissions = exhibitSubmissions.map((es) => es.submission);

  return (
    <PageLayout maxWidth="max-w-6xl" className="w-full">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">
              {t("manageContentTitle", { title: exhibit.title })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("manageContentDescription")}
            </p>
          </div>
          <Link href={`/admin/exhibits/${exhibitId}/edit`}>
            <Button variant="ghost" size="sm">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t("backToEdit")}
            </Button>
          </Link>
        </div>
      </div>
      <ExhibitContentManager
        exhibitId={exhibitId}
        initialSubmissions={submissions}
      />
    </PageLayout>
  );
}
