import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { ExhibitFormSimple } from "../exhibit-form-simple";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewExhibitPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  // Get all users for curator selector
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // For new exhibits, we'll fetch some public submissions for the featured selector
  // In practice, they can add submissions to the exhibit first, then select a featured one
  const submissions = await prisma.submission.findMany({
    where: {
      shareStatus: "PUBLIC",
    },
    include: {
      prompt: {
        select: {
          word1: true,
          word2: true,
          word3: true,
        },
      },
    },
    take: 50,
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <PageLayout maxWidth="max-w-4xl" className="w-full">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">
              Create New Exhibit
            </h1>
            <p className="text-sm text-muted-foreground">
              Create a new temporary exhibit
            </p>
          </div>
          <Link href="/admin/exhibits">
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
              Back to Exhibits
            </Button>
          </Link>
        </div>
      </div>

      <ExhibitFormSimple
        users={users}
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
        }))}
        mode="create"
      />
    </PageLayout>
  );
}
