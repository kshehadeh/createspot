import { Breadcrumb } from "@/components/breadcrumb";
import { getRouteByPath } from "@/lib/routes";

export default async function ExhibitionBreadcrumb() {
  const exhibitionRoute = getRouteByPath("/exhibition");

  return (
    <Breadcrumb
      segments={[
        {
          label: exhibitionRoute?.label || "Exhibit",
          icon: exhibitionRoute?.icon,
        },
      ]}
    />
  );
}
