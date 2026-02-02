import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface CollectionViewBreadcrumbProps {
  params: Promise<{ creatorid: string; collectionid: string }>;
}

export default async function CollectionViewBreadcrumb({
  params,
}: CollectionViewBreadcrumbProps) {
  const { creatorid, collectionid } = await params;
  const tCollections = await getTranslations("collections");
  const tNavigation = await getTranslations("navigation");

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
      label: tNavigation("creators"),
      href: "/creators",
    },
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
    },
  ];

  return <Breadcrumb segments={segments} />;
}
