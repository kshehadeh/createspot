import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function AdminExhibitsNewBreadcrumb() {
  const segments = buildBreadcrumbFromParent("/admin/exhibits/new");

  return <Breadcrumb segments={segments} />;
}
