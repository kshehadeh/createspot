import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

interface SubmissionBreadcrumbProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionBreadcrumb({
  params,
}: SubmissionBreadcrumbProps) {
  const { id } = await params;
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { title: true },
  });

  return (
    <Breadcrumb
      segments={[
        { label: "Submission" },
        { label: submission?.title || "Untitled" },
      ]}
    />
  );
}
