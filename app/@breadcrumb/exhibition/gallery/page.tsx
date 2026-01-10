import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function ExhibitionGalleryBreadcrumb() {
  const segments = buildBreadcrumbFromParent("/exhibition/gallery");

  return <Breadcrumb segments={segments} />;
}
