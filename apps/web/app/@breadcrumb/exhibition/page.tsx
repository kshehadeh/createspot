import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export default async function ExhibitionBreadcrumb() {
  const t = await getTranslations("navigation");
  const exhibitionRoute = getTranslatedRouteByPath("/exhibition", t);

  return (
    <Breadcrumb
      segments={[
        {
          label: exhibitionRoute?.label || t("exhibits"),
          icon: exhibitionRoute?.icon,
        },
      ]}
    />
  );
}
