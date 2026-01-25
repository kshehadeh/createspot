import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface ProfileBreadcrumbProps {
  params: Promise<{ creatorid: string }>;
}

export default async function ProfileBreadcrumb({
  params,
}: ProfileBreadcrumbProps) {
  const { creatorid } = await params;
  const t = await getTranslations("navigation");
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: { name: true },
  });

  const userName = user?.name || "Unknown";

  return (
    <Breadcrumb
      segments={[
        {
          label: t("creators"),
          href: "/creators",
        },
        {
          label: userName,
          // Last item - no link since it's the current page
        },
      ]}
    />
  );
}
