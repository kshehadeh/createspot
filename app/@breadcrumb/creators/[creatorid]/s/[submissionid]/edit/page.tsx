import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface SubmissionEditBreadcrumbProps {
  params: Promise<{ creatorid: string; submissionid: string }>;
}

export default async function SubmissionEditBreadcrumb({
  params,
}: SubmissionEditBreadcrumbProps) {
  const { creatorid, submissionid } = await params;
  const tNavigation = await getTranslations("navigation");
  const tSubmission = await getTranslations("submission");
  const tExhibition = await getTranslations("exhibition");

  const submission = await prisma.submission.findUnique({
    where: { id: submissionid },
    select: { title: true, userId: true },
  });

  // Find creator by slug or ID and verify submission belongs to creator
  const creator = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: { id: true },
  });

  if (!submission || !creator || submission.userId !== creator.id) {
    return <Breadcrumb segments={[{ label: tSubmission("edit") || "Edit" }]} />;
  }

  const submissionTitle = submission.title || tExhibition("untitled");

  return (
    <Breadcrumb
      segments={[
        { label: tNavigation("home"), href: "/" },
        {
          label: submissionTitle,
          href: `/creators/${creatorid}/s/${submissionid}`,
        },
        { label: tSubmission("edit") },
      ]}
    />
  );
}
