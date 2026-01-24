import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface ImageEditorBreadcrumbProps {
  params: Promise<{ id: string }>;
}

export default async function ImageEditorBreadcrumb({
  params,
}: ImageEditorBreadcrumbProps) {
  const { id } = await params;
  const tSubmission = await getTranslations("submission");
  const tExhibition = await getTranslations("exhibition");
  const tImageEditor = await getTranslations("imageEditor");

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: { title: true },
  });

  const submissionTitle = submission?.title || tExhibition("untitled");

  return (
    <Breadcrumb
      segments={[
        { label: tSubmission("label"), href: "/" },
        { label: submissionTitle, href: `/s/${id}` },
        { label: tImageEditor("title") },
      ]}
    />
  );
}
