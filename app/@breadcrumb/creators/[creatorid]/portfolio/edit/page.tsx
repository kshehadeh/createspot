import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { Breadcrumb } from "@/components/breadcrumb";

interface PortfolioEditBreadcrumbProps {
  params: Promise<{ creatorid: string }>;
}

export default async function PortfolioEditBreadcrumb({
  params,
}: PortfolioEditBreadcrumbProps) {
  const { creatorid } = await params;
  const session = await auth();
  const t = await getTranslations("navigation");
  const userName = session?.user?.name;

  return (
    <Breadcrumb
      segments={[
        {
          label: userName || "Your Portfolio",
          href: `/creators/${creatorid}/portfolio`,
        },
        { label: t("edit") },
      ]}
    />
  );
}
