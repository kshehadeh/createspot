import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { PortfolioEditForm } from "./portfolio-edit-form";
import { Briefcase } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PortfolioEditPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
    where: { userId: session.user.id },
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

  // Fetch portfolio items
  const portfolioItems = await prisma.submission.findMany({
    where: {
      userId: session.user.id,
      isPortfolio: true,
    },
    orderBy: [{ portfolioOrder: "asc" }, { createdAt: "desc" }],
    include: {
      prompt: {
        select: {
          word1: true,
          word2: true,
          word3: true,
        },
      },
      _count: {
        select: { favorites: true },
      },
    },
  });

  return (
    <PageLayout maxWidth="max-w-5xl" className="w-full">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Manage Portfolio
              </h1>
              <p className="text-sm text-muted-foreground">
                Add, edit, and organize your portfolio items
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Link
              href={`/portfolio/${user.id}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Browse Portfolio →
            </Link>
            <Link
              href={`/profile/${user.id}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View Profile →
            </Link>
          </div>
        </div>
      </div>

      <PortfolioEditForm
        featuredSubmissionId={user.featuredSubmissionId}
        submissions={submissions.map((s) => ({
          id: s.id,
          title: s.title,
          imageUrl: s.imageUrl,
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
          },
          shareStatus: p.shareStatus,
        }))}
      />
    </PageLayout>
  );
}
