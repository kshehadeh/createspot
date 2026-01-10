import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function ExhibitionGlobalBreadcrumb() {
  const segments = buildBreadcrumbFromParent("/exhibition/global");

  return <Breadcrumb segments={segments} />;
}
