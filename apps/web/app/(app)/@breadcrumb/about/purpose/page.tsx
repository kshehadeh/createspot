import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export default async function AboutPurposeBreadcrumb() {
  const t = await getTranslations("navigation");
  const aboutRoute = getTranslatedRouteByPath("/about", t);

  return (
    <Breadcrumb
      segments={[
        {
          label: aboutRoute?.label || t("about"),
          href: "/about",
          icon: aboutRoute?.icon,
        },
        { label: "Purpose" },
      ]}
    />
  );
}
