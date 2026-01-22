import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export default async function AboutFeaturesBreadcrumb() {
  const t = await getTranslations("navigation");
  const aboutRoute = getTranslatedRouteByPath("/about", t);
  const featuresRoute = getTranslatedRouteByPath("/about/features", t);

  return (
    <Breadcrumb
      segments={[
        {
          label: aboutRoute?.label || t("about"),
          href: "/about",
          icon: aboutRoute?.icon,
        },
        { label: featuresRoute?.label || "Features" },
      ]}
    />
  );
}
