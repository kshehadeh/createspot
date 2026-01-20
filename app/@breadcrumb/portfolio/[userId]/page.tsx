import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export const dynamic = "force-dynamic";

interface PortfolioBreadcrumbProps {
  params: Promise<{ userId: string }>;
}

export default async function PortfolioBreadcrumb({
  params,
}: PortfolioBreadcrumbProps) {
  const { userId } = await params;
  const t = await getTranslations("navigation");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const portfolioRoute = getTranslatedRouteByPath("/portfolio", t);
  const userName = user?.name || "Unknown";

  return (
    <Breadcrumb
      segments={[
        {
          label: portfolioRoute?.label || t("portfolio"),
          href: `/portfolio/${userId}`,
        },
        {
          label: userName,
          // Last item - no link since it's the current page
        },
      ]}
    />
  );
}
