import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function AdminPromptsBreadcrumb() {
  const segments = buildBreadcrumbFromParent("/admin/prompts");

  return <Breadcrumb segments={segments} />;
}
