import { getTranslations } from "next-intl/server";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export default async function PromptBreadcrumb() {
  const t = await getTranslations("navigation");
  const promptRoute = getTranslatedRouteByPath("/prompt", t);

  return (
    <Breadcrumb
      segments={[
        {
          label: promptRoute?.label || t("prompts"),
          icon: promptRoute?.icon,
        },
      ]}
    />
  );
}
