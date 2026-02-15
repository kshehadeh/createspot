import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function ExhibitionGalleryBreadcrumb() {
  const t = await getTranslations("navigation");

  // Default breadcrumb for permanent collection - redirects to grid
  const segments = buildBreadcrumbFromParent(
    "/inspire/exhibition/gallery/grid",
    [],
    t,
  );
  return <Breadcrumb segments={segments} />;
}
