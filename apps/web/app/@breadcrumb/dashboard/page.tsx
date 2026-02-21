import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export default async function DashboardBreadcrumb() {
  const t = await getTranslations("navigation");
  const route = getTranslatedRouteByPath("/dashboard", t);

  return (
    <Breadcrumb
      segments={[
        {
          label: route?.label || t("dashboard"),
          icon: route?.icon,
        },
      ]}
    />
  );
}
