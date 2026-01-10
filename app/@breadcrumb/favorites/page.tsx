import { Breadcrumb } from "@/components/breadcrumb";
import { getRouteByPath } from "@/lib/routes";

export default async function FavoritesBreadcrumb() {
  const favoritesRoute = getRouteByPath("/favorites");

  return (
    <Breadcrumb
      segments={[
        {
          label: favoritesRoute?.label || "Favorites",
          icon: favoritesRoute?.icon,
        },
      ]}
    />
  );
}
