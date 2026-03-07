import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function AdminUsersBreadcrumb() {
  const t = await getTranslations("navigation");
  const segments = buildBreadcrumbFromParent("/admin/users", [], t);

  return <Breadcrumb segments={segments} />;
}
