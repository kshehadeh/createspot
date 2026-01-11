import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export default async function AdminBreadcrumb() {
  const t = await getTranslations("navigation");
  const adminRoute = getTranslatedRouteByPath("/admin", t);

  return (
    <Breadcrumb
      segments={[
        {
          label: adminRoute?.label || t("admin"),
          icon: adminRoute?.icon,
        },
      ]}
    />
  );
}
