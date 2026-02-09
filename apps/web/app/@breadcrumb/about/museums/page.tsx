import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export default async function AboutMuseumsBreadcrumb() {
  const t = await getTranslations("navigation");
  const tAbout = await getTranslations("about");
  const aboutRoute = getTranslatedRouteByPath("/about", t);

  return (
    <Breadcrumb
      segments={[
        {
          label: aboutRoute?.label || t("about"),
          href: "/about",
          icon: aboutRoute?.icon,
        },
        { label: tAbout("museums.title") },
      ]}
    />
  );
}
