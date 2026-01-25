import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { PortfolioEditForm } from "@/components/portfolio-edit-form";
import { Briefcase, Eye, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PortfolioEditPageProps {
  params: Promise<{ creatorid: string }>;
}

export default async function PortfolioEditPage({
  params,
}: PortfolioEditPageProps) {
  const { creatorid } = await params;
  const session = await auth();
  const t = await getTranslations("profile");

  if (!session?.user?.id) {
    redirect("/");
  }

  // Ensure user can only edit their own portfolio
  if (session.user.id !== creatorid) {
    redirect(`/creators/${session.user.id}/portfolio/edit`);
  }

  const user = await prisma.user.findUnique({
    where: { id: creatorid },
    select: {
      id: true,
      name: true,
      image: true,
      featuredSubmissionId: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  // Fetch all user submissions for adding to portfolio (up to 100)
  const submissions = await prisma.submission.findMany({
    where: { userId: creatorid },
    include: {
      prompt: {
        select: {
          word1: true,
          word2: true,
          word3: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Fetch portfolio items with pagination (initial 50 items)
  const PAGE_SIZE = 50;
  const [portfolioItems, totalPortfolioCount] = await Promise.all([
    prisma.submission.findMany({
      where: {
        userId: creatorid,
        isPortfolio: true,
      },
      orderBy: [{ portfolioOrder: "asc" }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      include: {
        prompt: {
          select: {
            word1: true,
            word2: true,
            word3: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            views: true,
          },
        },
      },
    }),
    prisma.submission.count({
      where: {
        userId: creatorid,
        isPortfolio: true,
      },
    }),
  ]);

  return (
    <PageLayout maxWidth="max-w-5xl" className="w-full">
      <PageHeader
        title={t("managePortfolio")}
        subtitle={t("managePortfolioDescription")}
        rightContent={
          <div className="flex flex-row flex-wrap items-end justify-end gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/creators/${user.id}/collections`}>
                <FolderOpen className="h-4 w-4" />
                <span className="hidden md:inline">{t("collections")}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/creators/${user.id}/portfolio`}>
                <Briefcase className="h-4 w-4" />
                <span className="hidden md:inline">{t("browsePortfolio")}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/creators/${user.id}`}>
                <Eye className="h-4 w-4" />
                <span className="hidden md:inline">{t("viewProfile")}</span>
              </Link>
            </Button>
          </div>
        }
      />

      <PortfolioEditForm
        featuredSubmissionId={user.featuredSubmissionId}
        submissions={submissions.map((s) => ({
          id: s.id,
          title: s.title,
          imageUrl: s.imageUrl,
          imageFocalPoint: s.imageFocalPoint as { x: number; y: number } | null,
          text: s.text,
          wordIndex: s.wordIndex,
          isPortfolio: s.isPortfolio,
          tags: s.tags,
          category: s.category,
          prompt: s.prompt
            ? {
                word1: s.prompt.word1,
                word2: s.prompt.word2,
                word3: s.prompt.word3,
              }
            : null,
          shareStatus: s.shareStatus,
        }))}
        portfolioItems={portfolioItems.map((p) => ({
          id: p.id,
          title: p.title,
          imageUrl: p.imageUrl,
          imageFocalPoint: p.imageFocalPoint as { x: number; y: number } | null,
          text: p.text,
          isPortfolio: p.isPortfolio,
          portfolioOrder: p.portfolioOrder,
          tags: p.tags,
          category: p.category,
          promptId: p.promptId,
          wordIndex: p.wordIndex,
          prompt: p.prompt
            ? {
                word1: p.prompt.word1,
                word2: p.prompt.word2,
                word3: p.prompt.word3,
              }
            : null,
          _count: {
            favorites: p._count.favorites,
            views: p._count.views,
          },
          shareStatus: p.shareStatus,
        }))}
        totalPortfolioCount={totalPortfolioCount}
      />
    </PageLayout>
  );
}
