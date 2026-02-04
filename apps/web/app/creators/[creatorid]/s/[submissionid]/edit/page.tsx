import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTutorialData } from "@/lib/get-tutorial-data";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { SubmissionEditForm } from "@/components/submission-edit-form";

export const dynamic = "force-dynamic";

interface SubmissionEditPageProps {
  params: Promise<{ creatorid: string; submissionid: string }>;
}

async function getSubmission(id: string) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      imageFocalPoint: true,
      text: true,
      category: true,
      tags: true,
      shareStatus: true,
      critiquesEnabled: true,
      userId: true,
      progressions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          imageUrl: true,
          text: true,
          comment: true,
          order: true,
        },
      },
    },
  });

  return submission;
}

export default async function SubmissionEditPage({
  params,
}: SubmissionEditPageProps) {
  const session = await auth();
  const t = await getTranslations("modals.submissionEdit");

  if (!session?.user?.id) {
    redirect("/");
  }

  const { creatorid, submissionid } = await params;

  const [submission, tutorialData] = await Promise.all([
    getSubmission(submissionid),
    getTutorialData(session?.user?.id),
  ]);

  if (!submission) {
    notFound();
  }

  // Verify the submission belongs to the creator in the URL
  // Check both slug and ID
  const creator = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: { id: true },
  });

  if (!creator || submission.userId !== creator.id) {
    notFound();
  }

  // Only allow the owner to edit - return 404 to hide existence
  if (submission.userId !== session.user.id) {
    notFound();
  }

  return (
    <PageLayout maxWidth="max-w-5xl" className="w-full">
      <PageHeader title={t("editTitle")} subtitle={t("editDescription")} />
      <SubmissionEditForm
        submissionId={submission.id}
        initialData={{
          id: submission.id,
          title: submission.title,
          imageUrl: submission.imageUrl,
          imageFocalPoint: submission.imageFocalPoint as
            | { x: number; y: number }
            | null
            | undefined,
          text: submission.text,
          tags: submission.tags,
          category: submission.category,
          shareStatus: submission.shareStatus,
          critiquesEnabled: submission.critiquesEnabled,
          progressions: submission.progressions,
        }}
        tutorialData={tutorialData}
      />
    </PageLayout>
  );
}
