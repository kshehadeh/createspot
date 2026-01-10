import { Breadcrumb } from "@/components/breadcrumb";
import { getRouteByPath } from "@/lib/routes";

export default async function AboutBreadcrumb() {
  const aboutRoute = getRouteByPath("/about");

  return (
    <Breadcrumb
      segments={[
        {
          label: aboutRoute?.label || "About",
          icon: aboutRoute?.icon,
        },
      ]}
    />
  );
}
