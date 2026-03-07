import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getCreator } from "@/lib/creators";
import { Breadcrumb } from "@/components/breadcrumb";

interface CreatorCritiquesListBreadcrumbProps {
  params: Promise<{ creatorid: string }>;
}

async function CreatorCritiquesBreadcrumbContent({
  params,
}: CreatorCritiquesListBreadcrumbProps) {
  const { creatorid } = await params;
  const tNavigation = await getTranslations("navigation");

  const creator = await getCreator(creatorid);

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

export default function CreatorCritiquesListBreadcrumb({
  params,
}: CreatorCritiquesListBreadcrumbProps) {
  return (
    <Suspense fallback={null}>
      <CreatorCritiquesBreadcrumbContent params={params} />
    </Suspense>
  );
}
