import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getExhibitById } from "@/lib/exhibits";

interface ExhibitionPathExhibitBreadcrumbProps {
  params: Promise<{ exhibitId: string }>;
}

export default async function ExhibitionPathExhibitBreadcrumb({
  params,
}: ExhibitionPathExhibitBreadcrumbProps) {
  const t = await getTranslations("navigation");
  const { exhibitId } = await params;

  const exhibit = await getExhibitById(exhibitId);
  if (exhibit) {
    return (
      <Breadcrumb
        segments={[
          { label: t("exhibits"), href: "/inspire/exhibition" },
          { label: exhibit.title, href: `/inspire/exhibition/${exhibitId}` },
          { label: t("constellation") },
        ]}
      />
    );
  }

  // Fallback if exhibit not found
  return (
    <Breadcrumb
      segments={[
        { label: t("exhibits"), href: "/inspire/exhibition" },
        { label: t("constellation") },
      ]}
    />
  );
}
