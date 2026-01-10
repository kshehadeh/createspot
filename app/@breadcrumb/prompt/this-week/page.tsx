import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function PromptThisWeekBreadcrumb() {
  const segments = buildBreadcrumbFromParent("/prompt/this-week");

  return <Breadcrumb segments={segments} />;
}
