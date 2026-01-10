import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function PromptPlayBreadcrumb() {
  const segments = buildBreadcrumbFromParent("/prompt/play");

  return <Breadcrumb segments={segments} />;
}
