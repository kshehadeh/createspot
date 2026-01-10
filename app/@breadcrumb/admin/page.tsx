import { Breadcrumb } from "@/components/breadcrumb";
import { getRouteByPath } from "@/lib/routes";

export default async function AdminBreadcrumb() {
  const adminRoute = getRouteByPath("/admin");

  return (
    <Breadcrumb
      segments={[
        {
          label: adminRoute?.label || "Admin",
          icon: adminRoute?.icon,
        },
      ]}
    />
  );
}
