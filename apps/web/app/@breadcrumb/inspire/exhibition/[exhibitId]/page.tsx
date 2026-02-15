import { getTranslations } from "next-intl/server";
import { getExhibitById } from "@/lib/exhibits";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface ExhibitBreadcrumbProps {
  params: Promise<{ exhibitId: string }>;
}

export default async function ExhibitBreadcrumb({
  params,
}: ExhibitBreadcrumbProps) {
  const { exhibitId } = await params;
  const t = await getTranslations("navigation");
  const exhibit = await getExhibitById(exhibitId);

  return (
    <Breadcrumb
      segments={[
        { label: t("exhibit"), href: "/inspire/exhibition" },
        { label: exhibit?.title || "Unknown" },
      ]}
    />
  );
}
