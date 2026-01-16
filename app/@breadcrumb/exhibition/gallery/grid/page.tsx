import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function ExhibitionGridBreadcrumb() {
  const t = await getTranslations("navigation");

  // Default breadcrumb for permanent collection
  const segments = buildBreadcrumbFromParent("/exhibition/gallery/grid", [], t);
  return <Breadcrumb segments={segments} />;
}
