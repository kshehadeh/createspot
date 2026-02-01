import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface CritiquesBreadcrumbProps {
  params: Promise<{ creatorid: string; submissionid: string }>;
}

export default async function CritiquesBreadcrumb({
  params,
}: CritiquesBreadcrumbProps) {
  const { creatorid, submissionid } = await params;
  const tNavigation = await getTranslations("navigation");
  const tExhibition = await getTranslations("exhibition");
  const submission = await prisma.submission.findUnique({
    where: { id: submissionid },
    select: { title: true, userId: true },
  });

  const creator = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: { id: true, name: true },
  });

  if (!submission || !creator || submission.userId !== creator.id) {
    return (
      <Breadcrumb
        segments={[{ label: tNavigation("critiques") || "Critiques" }]}
      />
    );
  }

  const submissionTitle = submission.title || tExhibition("untitled");

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
        {
          label: submissionTitle,
          href: `/creators/${creatorid}/s/${submissionid}`,
        },
        { label: tNavigation("critiques") },
      ]}
    />
  );
}
