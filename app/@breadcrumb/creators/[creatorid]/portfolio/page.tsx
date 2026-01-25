import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export const dynamic = "force-dynamic";

interface PortfolioBreadcrumbProps {
  params: Promise<{ creatorid: string }>;
}

export default async function PortfolioBreadcrumb({
  params,
}: PortfolioBreadcrumbProps) {
  const { creatorid } = await params;
  const t = await getTranslations("navigation");
  const user = await prisma.user.findUnique({
    where: { id: creatorid },
    select: { name: true },
  });

  const portfolioRoute = getTranslatedRouteByPath(
    `/creators/${creatorid}/portfolio`,
    t,
  );
  const userName = user?.name || "Unknown";

  return (
    <Breadcrumb
      segments={[
        {
          label: userName,
          href: `/creators/${creatorid}`,
        },
        {
          label: portfolioRoute?.label || t("portfolio"),
          // Last item - no link since it's the current page
        },
      ]}
    />
  );
}
