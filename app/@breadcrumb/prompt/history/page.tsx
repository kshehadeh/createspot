import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function PromptHistoryBreadcrumb() {
  const segments = buildBreadcrumbFromParent("/prompt/history");

  return <Breadcrumb segments={segments} />;
}
