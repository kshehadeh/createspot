import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

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

  return (
    <Breadcrumb
      segments={[{ label: "Portfolio" }, { label: user?.name || "Unknown" }]}
    />
  );
}
