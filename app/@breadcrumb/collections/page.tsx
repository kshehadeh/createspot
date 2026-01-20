import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export const dynamic = "force-dynamic";

export default async function CollectionsBreadcrumb() {
  const t = await getTranslations("navigation");
  const segments = buildBreadcrumbFromParent("/collections", [], t);
  return <Breadcrumb segments={segments} />;
}
