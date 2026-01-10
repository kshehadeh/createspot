import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function ExhibitionConstellationBreadcrumb() {
  const segments = buildBreadcrumbFromParent("/exhibition/constellation");

  return <Breadcrumb segments={segments} />;
}
