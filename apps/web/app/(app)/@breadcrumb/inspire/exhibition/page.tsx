import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function ExhibitionBreadcrumb() {
  const t = await getTranslations("navigation");
  const segments = buildBreadcrumbFromParent("/inspire/exhibition", [], t);

  return <Breadcrumb segments={segments} />;
}
