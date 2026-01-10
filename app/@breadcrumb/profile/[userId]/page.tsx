import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

interface ProfileBreadcrumbProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfileBreadcrumb({
  params,
}: ProfileBreadcrumbProps) {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  return (
    <Breadcrumb
      segments={[{ label: "Profile" }, { label: user?.name || "Unknown" }]}
    />
  );
}
