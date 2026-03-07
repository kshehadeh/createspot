import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { buildBreadcrumbFromParent } from "@/lib/routes";

export default async function AdminPromptsBreadcrumb() {
  const t = await getTranslations("navigation");
  const segments = buildBreadcrumbFromParent("/admin/prompts", [], t);

  return <Breadcrumb segments={segments} />;
}
