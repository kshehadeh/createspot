import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { ExhibitFormSimple } from "../../exhibit-form-simple";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface EditExhibitPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExhibitPage({
  params,
}: EditExhibitPageProps) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/");
  }

  const { id: exhibitId } = await params;

  const exhibit = await prisma.exhibit.findUnique({
    where: { id: exhibitId },
    include: {
      curator: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      featuredArtist: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      featuredSubmission: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          text: true,
          wordIndex: true,
          isPortfolio: true,
          tags: true,
          category: true,
          prompt: {
            select: {
              word1: true,
              word2: true,
              word3: true,
            },
          },
        },
      },
      _count: {
        select: { submissions: true },
      },
    },
  });

  if (!exhibit) {
    redirect("/admin/exhibits");
  }

  const t = await getTranslations("admin.exhibits");

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

  // Get submissions for featured submission selector
  const submissions = await prisma.submission.findMany({
    where: {
      exhibitSubmissions: {
        some: {
          exhibitId: exhibit.id,
        },
      },
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
    take: 100,
  });

  return (
    <PageLayout maxWidth="max-w-4xl" className="w-full">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">
              {t("editTitle", { title: exhibit.title })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("editDescription")}
            </p>
          </div>
          <Link href={`/exhibition/${exhibit.id}`}>
            <Button variant="outline" size="sm">
              View Exhibit
            </Button>
          </Link>
        </div>
      </div>

      <ExhibitFormSimple
        exhibit={{
          id: exhibit.id,
          title: exhibit.title,
          description: exhibit.description,
          startTime: exhibit.startTime,
          endTime: exhibit.endTime,
          isActive: exhibit.isActive,
          curatorId: exhibit.curatorId,
          featuredArtistId: exhibit.featuredArtistId,
          featuredSubmissionId: exhibit.featuredSubmissionId,
          allowedViewTypes: exhibit.allowedViewTypes,
        }}
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
        mode="edit"
        exhibitId={exhibit.id}
      />
    </PageLayout>
  );
}
