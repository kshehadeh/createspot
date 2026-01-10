import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function AdminUsersBreadcrumb() {
  const segments = buildBreadcrumbFromParent("/admin/users");

  return <Breadcrumb segments={segments} />;
}
