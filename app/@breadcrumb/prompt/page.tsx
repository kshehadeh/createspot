import { Breadcrumb } from "@/components/breadcrumb";
import { getRouteByPath } from "@/lib/routes";

export default async function PromptBreadcrumb() {
  const promptRoute = getRouteByPath("/prompt");

  return (
    <Breadcrumb
      segments={[
        {
          label: promptRoute?.label || "Prompts",
          icon: promptRoute?.icon,
        },
      ]}
    />
  );
}
