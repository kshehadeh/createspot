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
  const tNavigation = await getTranslations("navigation");
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
    select: { id: true, name: true },
  });

  if (!submission || !creator || submission.userId !== creator.id) {
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
          label: tNavigation("creators"),
          href: "/creators",
        },
        {
          label: creator.name || "Unknown",
          href: `/creators/${creatorid}`,
        },
        { label: submission.title || tExhibition("untitled") },
      ]}
    />
  );
}
