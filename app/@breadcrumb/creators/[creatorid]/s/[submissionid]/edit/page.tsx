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

  // Verify submission belongs to creator
  if (!submission || submission.userId !== creatorid) {
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
