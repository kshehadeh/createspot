import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";
import { getExhibitById } from "@/lib/exhibits";

interface ExhibitionGlobalBreadcrumbProps {
  searchParams: Promise<{
    exhibitId?: string | string[];
  }>;
}

export default async function ExhibitionGlobalBreadcrumb({
  searchParams,
}: ExhibitionGlobalBreadcrumbProps) {
  const t = await getTranslations("navigation");
  const params = await searchParams;

  const rawExhibitId = Array.isArray(params.exhibitId)
    ? params.exhibitId[0]
    : params.exhibitId;
  const exhibitId = rawExhibitId?.trim() || undefined;

  // If viewing a specific exhibit, fetch it and use its name
  if (exhibitId) {
    const exhibit = await getExhibitById(exhibitId);
    if (exhibit) {
      return (
        <Breadcrumb
          segments={[
            { label: t("exhibits"), href: "/exhibition" },
            { label: exhibit.title, href: `/exhibition/${exhibitId}` },
            { label: t("map") },
          ]}
        />
      );
    }
  }

  // Default breadcrumb for permanent collection
  const segments = buildBreadcrumbFromParent("/exhibition/global", [], t);
  return <Breadcrumb segments={segments} />;
}
