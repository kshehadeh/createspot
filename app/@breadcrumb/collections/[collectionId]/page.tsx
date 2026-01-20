import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/components/breadcrumb";

export const dynamic = "force-dynamic";

interface CollectionEditBreadcrumbProps {
  params: Promise<{ collectionId: string }>;
}

export default async function CollectionEditBreadcrumb({
  params,
}: CollectionEditBreadcrumbProps) {
  const { collectionId } = await params;
  const tCollections = await getTranslations("collections");

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { name: true },
  });

  const collectionName = collection?.name || tCollections("collection");

  // Build breadcrumb segments manually to ensure proper links
  const segments = [
    {
      label: tCollections("myCollections"),
      href: "/collections",
    },
    {
      label: collectionName,
    },
  ];

  return <Breadcrumb segments={segments} />;
}
