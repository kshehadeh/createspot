import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { ImageEditor } from "@/components/image-editor";

export const dynamic = "force-dynamic";

interface ImageEditorPageProps {
  params: Promise<{ creatorid: string; submissionid: string }>;
}

export default async function ImageEditorPage({
  params,
}: ImageEditorPageProps) {
  const session = await auth();
  const t = await getTranslations("imageEditor");

  if (!session?.user?.id) {
    redirect("/");
  }

  const { creatorid, submissionid } = await params;

  // Fetch the submission
  const submission = await prisma.submission.findUnique({
    where: { id: submissionid },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      userId: true,
    },
  });

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

  // Must have an image
  if (!submission.imageUrl) {
    redirect(`/creators/${creator.id}/s/${submissionid}`);
  }

  const pageTitle = submission.title || t("untitled");

  return (
    <PageLayout maxWidth="max-w-7xl" className="w-full">
      <PageHeader title={pageTitle} subtitle={t("subtitle")} />
      <ImageEditor
        submissionId={submission.id}
        imageUrl={submission.imageUrl}
        submissionTitle={submission.title}
      />
    </PageLayout>
  );
}
