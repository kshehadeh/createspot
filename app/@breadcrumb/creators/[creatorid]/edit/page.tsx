import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

interface ProfileEditBreadcrumbProps {
  params: Promise<{ creatorid: string }>;
}

export default async function ProfileEditBreadcrumb({
  params,
}: ProfileEditBreadcrumbProps) {
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
          href: `/creators/${creatorid}`,
        },
        { label: t("edit") },
      ]}
    />
  );
}
