import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function AdminExhibitsBreadcrumb() {
  const segments = buildBreadcrumbFromParent("/admin/exhibits");

  return <Breadcrumb segments={segments} />;
}
