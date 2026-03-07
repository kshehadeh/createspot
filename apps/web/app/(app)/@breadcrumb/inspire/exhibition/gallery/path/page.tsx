import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function ExhibitionPathBreadcrumb() {
  const t = await getTranslations("navigation");

  // Default breadcrumb for permanent collection
  const segments = buildBreadcrumbFromParent(
    "/inspire/exhibition/gallery/path",
    [],
    t,
  );
  return <Breadcrumb segments={segments} />;
}
