import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";
import { getRouteByPath } from "@/lib/routes";

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

  const profileRoute = getRouteByPath("/profile");
  const userName = user?.name || "Unknown";

  return (
    <Breadcrumb
      segments={[
        {
          label: profileRoute?.label || "Profile",
          // No href - profile doesn't have a root page
        },
        {
          label: userName,
          href: `/profile/${userId}`, // Last item links to itself
        },
      ]}
    />
  );
}
