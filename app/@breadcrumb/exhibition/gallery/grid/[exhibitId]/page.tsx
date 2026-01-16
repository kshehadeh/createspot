import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getExhibitById } from "@/lib/exhibits";

interface ExhibitionGridExhibitBreadcrumbProps {
  params: Promise<{ exhibitId: string }>;
}

export default async function ExhibitionGridExhibitBreadcrumb({
  params,
}: ExhibitionGridExhibitBreadcrumbProps) {
  const t = await getTranslations("navigation");
  const { exhibitId } = await params;

  const exhibit = await getExhibitById(exhibitId);
  if (exhibit) {
    return (
      <Breadcrumb
        segments={[
          { label: t("exhibits"), href: "/exhibition" },
          { label: exhibit.title, href: `/exhibition/${exhibitId}` },
          { label: t("grid") },
        ]}
      />
    );
  }

  // Fallback if exhibit not found
  return (
    <Breadcrumb
      segments={[
        { label: t("exhibits"), href: "/exhibition" },
        { label: t("grid") },
      ]}
    />
  );
}
