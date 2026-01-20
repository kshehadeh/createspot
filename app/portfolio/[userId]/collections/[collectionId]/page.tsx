import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Lock, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

interface CollectionViewPageProps {
  params: Promise<{ userId: string; collectionId: string }>;
}

export async function generateMetadata({
  params,
}: CollectionViewPageProps): Promise<Metadata> {
  const { userId, collectionId } = await params;
  const t = await getTranslations("collections");

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      user: { select: { name: true } },
      _count: {
        select: { submissions: true },
      },
    },
  });

  if (!collection || collection.userId !== userId) {
    return { title: `${t("notFound")} | Create Spot` };
  }

  // Only generate OG metadata for public collections
  // Private collections should not have shareable OG images
  if (!collection.isPublic) {
    const creatorName = collection.user.name || t("anonymous");
    return {
      title: `${collection.name} - ${creatorName} | Create Spot`,
      description: collection.description || undefined,
    };
  }

  const creatorName = collection.user.name || t("anonymous");
  const itemCount = collection._count.submissions;
  const description =
    collection.description ||
    `A collection by ${creatorName} with ${itemCount} ${itemCount !== 1 ? "items" : "item"}`;

  // Generate absolute OG image URL - Next.js will automatically use opengraph-image.tsx
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const ogImageUrl = `${baseUrl}/portfolio/${userId}/collections/${collectionId}/opengraph-image`;

  const pageTitle = `${collection.name} - ${creatorName} | Create Spot`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      images: [ogImageUrl],
      type: "website",
      url: `${baseUrl}/portfolio/${userId}/collections/${collectionId}`,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function CollectionViewPage({
  params,
}: CollectionViewPageProps) {
  const { userId, collectionId } = await params;
  const session = await auth();
  const t = await getTranslations("collections");

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
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

  if (!collection || collection.userId !== userId) {
    notFound();
  }

  const isOwner = session?.user?.id === collection.userId;

  // Check visibility
  if (!isOwner && !collection.isPublic) {
    notFound();
  }

  const user = collection.user;
  const isLoggedIn = !!session?.user;

  // Transform submissions for PortfolioGrid
  const portfolioItems = collection.submissions.map((cs) => ({
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
      {/* Header */}
      <div className="mb-8 w-full">
        <div className="flex items-start gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name || "User"}
              className="h-12 w-12 rounded-full shrink-0"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted shrink-0">
              <span className="text-lg font-medium text-muted-foreground">
                {user.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <PageHeader
              title={
                <div className="flex items-center gap-2">
                  <span className="truncate">{collection.name}</span>
                  {collection.isPublic ? (
                    <Globe className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
              }
              subtitle={
                <>
                  {user.name && (
                    <span>
                      {t("by", { name: user.name })}
                      {" · "}
                    </span>
                  )}
                  {collection._count.submissions}{" "}
                  {collection._count.submissions !== 1 ? t("items") : t("item")}
                </>
              }
              rightContent={
                <div className="flex flex-row flex-wrap items-end justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/portfolio/${user.id}/collections`}>
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden md:inline">
                        {t("allCollections")}
                      </span>
                    </Link>
                  </Button>
                  {isOwner && (
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`/portfolio/${userId}/collections/${collection.id}/edit`}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="hidden md:inline">{t("edit")}</span>
                      </Link>
                    </Button>
                  )}
                </div>
              }
            />
          </div>
        </div>

        {/* Description */}
        {collection.description && (
          <p className="mt-4 text-muted-foreground">{collection.description}</p>
        )}
      </div>

      {/* Collection Items Grid */}
      {portfolioItems.length > 0 ? (
        <PortfolioGrid
          items={portfolioItems}
          isLoggedIn={isLoggedIn}
          isOwnProfile={isOwner}
          user={{
            id: user.id,
            name: user.name,
            image: user.image,
          }}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">{t("emptyCollection")}</p>
          {isOwner && (
            <Link
              href={`/portfolio/${userId}/collections/${collection.id}/edit`}
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("addItems")}
            </Link>
          )}
        </div>
      )}
    </PageLayout>
  );
}
