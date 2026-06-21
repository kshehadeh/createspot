import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getExhibitById } from "@/lib/exhibits";

interface ExhibitionSketchbookExhibitBreadcrumbProps {
  params: Promise<{ exhibitId: string }>;
}

export default async function ExhibitionSketchbookExhibitBreadcrumb({
  params,
}: ExhibitionSketchbookExhibitBreadcrumbProps) {
  const t = await getTranslations("navigation");
  const { exhibitId } = await params;

  const exhibit = await getExhibitById(exhibitId);
  if (exhibit) {
    return (
      <Breadcrumb
        segments={[
          { label: t("exhibits"), href: "/inspire/exhibition" },
          { label: exhibit.title, href: `/inspire/exhibition/${exhibitId}` },
          { label: t("sketchbook") },
        ]}
      />
    );
  }

  return (
    <Breadcrumb
      segments={[
        { label: t("exhibits"), href: "/inspire/exhibition" },
        { label: t("sketchbook") },
      ]}
    />
  );
}
