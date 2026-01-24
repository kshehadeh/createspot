import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface SubmissionEditBreadcrumbProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionEditBreadcrumb({
  params,
}: SubmissionEditBreadcrumbProps) {
  const { id } = await params;
  const tNavigation = await getTranslations("navigation");
  const tSubmission = await getTranslations("submission");
  const tExhibition = await getTranslations("exhibition");

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { title: true },
  });

  const submissionTitle = submission?.title || tExhibition("untitled");

  return (
    <Breadcrumb
      segments={[
        { label: tNavigation("home"), href: "/" },
        { label: submissionTitle, href: `/s/${id}` },
        { label: tSubmission("edit") },
      ]}
    />
  );
}
