import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";
import { getTranslatedRouteByPath } from "@/lib/routes";

export const dynamic = "force-dynamic";

interface ProfileBreadcrumbProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfileBreadcrumb({
  params,
}: ProfileBreadcrumbProps) {
  const { userId } = await params;
  const t = await getTranslations("navigation");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const profileRoute = getTranslatedRouteByPath("/profile", t);
  const userName = user?.name || "Unknown";

  return (
    <Breadcrumb
      segments={[
        {
          label: profileRoute?.label || t("profile"),
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
