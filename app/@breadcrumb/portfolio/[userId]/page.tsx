import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";
import { getRouteByPath } from "@/lib/routes";

export const dynamic = "force-dynamic";

interface PortfolioBreadcrumbProps {
  params: Promise<{ userId: string }>;
}

export default async function PortfolioBreadcrumb({
  params,
}: PortfolioBreadcrumbProps) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const portfolioRoute = getRouteByPath("/portfolio");
  const userName = user?.name || "Unknown";

  return (
    <Breadcrumb
      segments={[
        {
          label: portfolioRoute?.label || "Portfolio",
          // No href - portfolio doesn't have a root page
        },
        {
          label: userName,
          href: `/portfolio/${userId}`, // Last item links to itself
        },
      ]}
    />
  );
}
