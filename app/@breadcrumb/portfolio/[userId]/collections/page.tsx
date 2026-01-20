import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface UserCollectionsBreadcrumbProps {
  params: Promise<{ userId: string }>;
}

export default async function UserCollectionsBreadcrumb({
  params,
}: UserCollectionsBreadcrumbProps) {
  const { userId } = await params;
  const tCollections = await getTranslations("collections");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const userName = user?.name || "Unknown";

  // Build breadcrumb segments manually to ensure proper links
  const segments = [
    {
      label: userName,
      href: `/portfolio/${userId}`,
    },
    {
      label: tCollections("collections"),
    },
  ];

  return <Breadcrumb segments={segments} />;
}
