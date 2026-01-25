import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { CollectionEditForm } from "@/components/collection-edit-form";

export const dynamic = "force-dynamic";

interface CollectionEditPageProps {
  params: Promise<{ creatorid: string; collectionid: string }>;
}

export async function generateMetadata({
  params,
}: CollectionEditPageProps): Promise<Metadata> {
  const { collectionid } = await params;
  const t = await getTranslations("collections");

  const collection = await prisma.collection.findUnique({
    where: { id: collectionid },
    select: { name: true },
  });

  if (!collection) {
    return { title: `${t("notFound")} | Create Spot` };
  }

  return {
    title: `${t("edit")} - ${collection.name} | Create Spot`,
  };
}

export default async function CollectionEditPage({
  params,
}: CollectionEditPageProps) {
  const { creatorid, collectionid } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionid },
    include: {
      submissions: {
        orderBy: { order: "asc" },
        include: {
          submission: {
            include: {
              prompt: {
                select: {
                  word1: true,
                  word2: true,
                  word3: true,
                },
              },
              _count: {
                select: { favorites: true },
              },
            },
          },
        },
      },
      _count: {
        select: { submissions: true },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  // Only owner can edit and must match the creatorid in URL
  if (
    collection.userId !== session.user.id ||
    collection.userId !== creatorid
  ) {
    notFound();
  }

  // Transform submissions for the form
  const items = collection.submissions.map((cs) => ({
    id: cs.submission.id,
    title: cs.submission.title,
    imageUrl: cs.submission.imageUrl,
    imageFocalPoint: cs.submission.imageFocalPoint as {
      x: number;
      y: number;
    } | null,
    text: cs.submission.text,
    isPortfolio: cs.submission.isPortfolio,
    portfolioOrder: cs.order,
    tags: cs.submission.tags,
    category: cs.submission.category,
    promptId: cs.submission.promptId,
    wordIndex: cs.submission.wordIndex,
    prompt: cs.submission.prompt,
    _count: cs.submission._count,
    shareStatus: cs.submission.shareStatus,
  }));

  return (
    <PageLayout maxWidth="max-w-6xl">
      <CollectionEditForm
        collection={{
          id: collection.id,
          name: collection.name,
          description: collection.description,
          isPublic: collection.isPublic,
          userId: collection.userId,
        }}
        items={items}
        userId={session.user.id}
      />
    </PageLayout>
  );
}
