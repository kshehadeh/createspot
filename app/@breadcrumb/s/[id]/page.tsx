import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface SubmissionBreadcrumbProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionBreadcrumb({
  params,
}: SubmissionBreadcrumbProps) {
  const { id } = await params;
  const tSubmission = await getTranslations("submission");
  const tExhibition = await getTranslations("exhibition");
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { title: true },
  });

  return (
    <Breadcrumb
      segments={[
        { label: tSubmission("label") },
        { label: submission?.title || tExhibition("untitled") },
      ]}
    />
  );
}
