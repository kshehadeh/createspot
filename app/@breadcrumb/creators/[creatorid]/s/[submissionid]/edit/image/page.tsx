import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface ImageEditorBreadcrumbProps {
  params: Promise<{ creatorid: string; submissionid: string }>;
}

export default async function ImageEditorBreadcrumb({
  params,
}: ImageEditorBreadcrumbProps) {
  const { creatorid, submissionid } = await params;
  const tSubmission = await getTranslations("submission");
  const tExhibition = await getTranslations("exhibition");
  const tImageEditor = await getTranslations("imageEditor");

  const submission = await prisma.submission.findUnique({
    where: { id: submissionid },
    select: { title: true, userId: true },
  });

  // Verify submission belongs to creator
  if (!submission || submission.userId !== creatorid) {
    return (
      <Breadcrumb
        segments={[{ label: tImageEditor("title") || "Image Editor" }]}
      />
    );
  }

  const submissionTitle = submission.title || tExhibition("untitled");

  return (
    <Breadcrumb
      segments={[
        { label: tSubmission("label"), href: "/" },
        {
          label: submissionTitle,
          href: `/creators/${creatorid}/s/${submissionid}`,
        },
        { label: tImageEditor("title") },
      ]}
    />
  );
}
