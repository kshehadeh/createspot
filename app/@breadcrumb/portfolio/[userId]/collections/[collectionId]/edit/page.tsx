import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface CollectionEditBreadcrumbProps {
  params: Promise<{ userId: string; collectionId: string }>;
}

export default async function CollectionEditBreadcrumb({
  params,
}: CollectionEditBreadcrumbProps) {
  const { userId, collectionId } = await params;
  const t = await getTranslations("navigation");
  const tCollections = await getTranslations("collections");

  const [user, collection] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.collection.findUnique({
      where: { id: collectionId },
      select: { name: true },
    }),
  ]);

  const userName = user?.name || "Unknown";
  const collectionName = collection?.name || tCollections("collection");

  // Build breadcrumb segments manually to ensure proper links
  // Override the /portfolio route to link to the actual portfolio page
  const segments = [
    {
      label: userName,
      href: `/portfolio/${userId}`,
    },
    {
      label: tCollections("collections"),
      href: `/portfolio/${userId}/collections`,
    },
    {
      label: collectionName,
      href: `/portfolio/${userId}/collections/${collectionId}`,
    },
    {
      label: t("edit"),
    },
  ];

  return <Breadcrumb segments={segments} />;
}
