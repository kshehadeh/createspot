import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface CreatorCritiquesListBreadcrumbProps {
  params: Promise<{ creatorid: string }>;
}

export default async function CreatorCritiquesListBreadcrumb({
  params,
}: CreatorCritiquesListBreadcrumbProps) {
  const { creatorid } = await params;
  const tNavigation = await getTranslations("navigation");

  const creator = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: { id: true, name: true },
  });

  if (!creator) {
    return (
      <Breadcrumb
        segments={[{ label: tNavigation("critiques") || "Critiques" }]}
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
        { label: tNavigation("critiques") },
      ]}
    />
  );
}
