import { Breadcrumb } from "@/components/breadcrumb";
import { getRouteByPath } from "@/lib/routes";

export default async function AboutPurposeBreadcrumb() {
  const aboutRoute = getRouteByPath("/about");

  return (
    <Breadcrumb
      segments={[
        {
          label: aboutRoute?.label || "About",
          href: "/about",
          icon: aboutRoute?.icon,
        },
        { label: "Purpose" },
      ]}
    />
  );
}
