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

  // Find creator by slug or ID and verify submission belongs to creator
  const creator = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: { id: true },
  });

  if (!submission || !creator || submission.userId !== creator.id) {
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
