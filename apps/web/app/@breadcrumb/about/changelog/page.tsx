import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export default async function AboutChangelogBreadcrumb() {
  const t = await getTranslations("navigation");
  const aboutRoute = getTranslatedRouteByPath("/about", t);
  const changelogRoute = getTranslatedRouteByPath("/about/changelog", t);

  return (
    <Breadcrumb
      segments={[
        {
          label: aboutRoute?.label || t("about"),
          href: "/about",
          icon: aboutRoute?.icon,
        },
        { label: changelogRoute?.label || "Changelog" },
      ]}
    />
  );
}
