import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export default async function FavoritesBreadcrumb() {
  const t = await getTranslations("navigation");
  const favoritesRoute = getTranslatedRouteByPath("/favorites", t);

  return (
    <Breadcrumb
      segments={[
        {
          label: favoritesRoute?.label || t("favorites"),
          icon: favoritesRoute?.icon,
        },
      ]}
    />
  );
}
