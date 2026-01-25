import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface SubmissionBreadcrumbProps {
  params: Promise<{ creatorid: string; submissionid: string }>;
}

export default async function SubmissionBreadcrumb({
  params,
}: SubmissionBreadcrumbProps) {
  const { creatorid, submissionid } = await params;
  const tSubmission = await getTranslations("submission");
  const tExhibition = await getTranslations("exhibition");
  const submission = await prisma.submission.findUnique({
    where: { id: submissionid },
    select: { title: true, userId: true },
  });

  // Verify submission belongs to creator
  if (!submission || submission.userId !== creatorid) {
    return (
      <Breadcrumb
        segments={[{ label: tSubmission("label") || "Submission" }]}
      />
    );
  }

  return (
    <Breadcrumb
      segments={[
        {
          label: tSubmission("label"),
          href: `/creators/${creatorid}`,
        },
        { label: submission.title || tExhibition("untitled") },
      ]}
    />
  );
}
