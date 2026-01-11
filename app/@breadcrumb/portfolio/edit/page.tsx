import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Breadcrumb } from "@/components/breadcrumb";

export default async function PortfolioEditBreadcrumb() {
  const session = await auth();
  const t = await getTranslations("navigation");
  const userId = session?.user?.id;
  const userName = session?.user?.name;

  return (
    <Breadcrumb
      segments={[
        {
          label: t("portfolio"),
          href: userId ? `/portfolio/${userId}` : undefined,
        },
        {
          label: userName || "Your Portfolio",
          href: userId ? `/portfolio/${userId}` : undefined,
        },
        { label: t("edit") },
      ]}
    />
  );
}
