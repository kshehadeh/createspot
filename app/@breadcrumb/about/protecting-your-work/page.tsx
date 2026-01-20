import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export default async function ProtectingYourWorkBreadcrumb() {
  const t = await getTranslations("navigation");
  const tPage = await getTranslations("aboutProtectingYourWork");
  const aboutRoute = getTranslatedRouteByPath("/about", t);

  return (
    <Breadcrumb
      segments={[
        {
          label: aboutRoute?.label || t("about"),
          href: "/about",
          icon: aboutRoute?.icon,
        },
        { label: tPage("breadcrumb") },
      ]}
    />
  );
}
