import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface CollectionEditBreadcrumbProps {
  params: Promise<{ creatorid: string; collectionid: string }>;
}

export default async function CollectionEditBreadcrumb({
  params,
}: CollectionEditBreadcrumbProps) {
  const { creatorid, collectionid } = await params;
  const t = await getTranslations("navigation");
  const tCollections = await getTranslations("collections");

  const [user, collection] = await Promise.all([
    prisma.user.findFirst({
      where: {
        OR: [{ slug: creatorid }, { id: creatorid }],
      },
      select: { name: true },
    }),
    prisma.collection.findUnique({
      where: { id: collectionid },
      select: { name: true },
    }),
  ]);

  const userName = user?.name || "Unknown";
  const collectionName = collection?.name || tCollections("collection");

  // Build breadcrumb segments manually to ensure proper links
  const segments = [
    {
      label: userName,
      href: `/creators/${creatorid}`,
    },
    {
      label: tCollections("collections"),
      href: `/creators/${creatorid}/collections`,
    },
    {
      label: collectionName,
      href: `/creators/${creatorid}/collections/${collectionid}`,
    },
    {
      label: t("edit"),
    },
  ];

  return <Breadcrumb segments={segments} />;
}
