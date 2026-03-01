import { Globe, Lock, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CollectionDownloadDropdown } from "@/components/collection-download-dropdown";
import { PageHeader } from "@/components/page-header";
import { PageLayout } from "@/components/page-layout";
import { PortfolioGridProfile } from "@/components/portfolio-grid";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getCollectionMetadata } from "@/lib/og-metadata";
import { prisma } from "@/lib/prisma";
import { getCreatorUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CollectionViewPageProps {
  params: Promise<{ creatorid: string; collectionid: string }>;
}

export async function generateMetadata({
  params,
}: CollectionViewPageProps): Promise<Metadata> {
  const { creatorid, collectionid } = await params;
  const t = await getTranslations("collections");

  const collection = await prisma.collection.findUnique({
    where: { id: collectionid },
    include: {
      user: { select: { id: true, name: true, slug: true } },
      _count: {
        select: { submissions: true },
      },
    },
  });

  // Find creator by slug or ID
  const creator = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: { id: true },
  });

  if (!collection || !creator || collection.userId !== creator.id) {
    return { title: `${t("notFound")} | Create Spot` };
  }

  if (!collection.isPublic) {
    const creatorName = collection.user.name || t("anonymous");
    return {
      title: `${collection.name} - ${creatorName} | Create Spot`,
      description: collection.description || undefined,
    };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return getCollectionMetadata(
    {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isPublic: collection.isPublic,
      user: collection.user,
      _count: collection._count,
    },
    baseUrl,
  );
}

export default async function CollectionViewPage({
  params,
}: CollectionViewPageProps) {
  const { creatorid, collectionid } = await params;
  const [session, t, collection, creator] = await Promise.all([
    auth(),
    getTranslations("collections"),
    prisma.collection.findUnique({
      where: { id: collectionid },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            slug: true,
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
                progressions: {
                  orderBy: { order: "desc" as const },
                  take: 1,
                  select: {
                    imageUrl: true,
                    text: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
    }),
    prisma.user.findFirst({
      where: {
        OR: [{ slug: creatorid }, { id: creatorid }],
      },
      select: { id: true },
    }),
  ]);

  if (!collection || !creator || collection.userId !== creator.id) {
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
  const portfolioItems = collection.submissions.map((cs) => {
    const latest = cs.submission.progressions?.[0];
    return {
      id: cs.submission.id,
      title: cs.submission.title,
      imageUrl: cs.submission.imageUrl,
      imageFocalPoint: cs.submission.imageFocalPoint as {
        x: number;
        y: number;
      } | null,
      text: cs.submission.text,
      isPortfolio: cs.submission.isPortfolio,
      isWorkInProgress: cs.submission.isWorkInProgress,
      portfolioOrder: cs.order,
      tags: cs.submission.tags,
      category: cs.submission.category,
      promptId: cs.submission.promptId,
      wordIndex: cs.submission.wordIndex,
      prompt: cs.submission.prompt,
      _count: cs.submission._count,
      shareStatus: cs.submission.shareStatus,
      latestProgressionImageUrl: latest?.imageUrl ?? null,
      latestProgressionText: latest?.text ?? null,
    };
  });

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
                <div className="flex items-center gap-2">
                  {collection.isPublic && (
                    <ShareButton
                      type="collection"
                      userId={user.id}
                      slug={user.slug}
                      collectionId={collection.id}
                    />
                  )}
                  {isOwner && portfolioItems.length > 0 && (
                    <CollectionDownloadDropdown
                      variant="collection"
                      collectionId={collection.id}
                      collectionName={collection.name}
                    />
                  )}
                  {isOwner && (
                    <Button asChild variant="outline" size="sm">
                      <Link
                        href={`${getCreatorUrl(user)}/collections/${collection.id}/edit`}
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

          {isOwner && (
            <div className="md:hidden mt-4 flex flex-wrap items-center gap-2">
              {portfolioItems.length > 0 && (
                <CollectionDownloadDropdown
                  variant="collection"
                  collectionId={collection.id}
                  collectionName={collection.name}
                />
              )}
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`${getCreatorUrl(user)}/collections/${collection.id}/edit`}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">{t("edit")}</span>
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Description */}
        {collection.description && (
          <p className="mt-4 text-muted-foreground">{collection.description}</p>
        )}
      </div>

      {/* Collection Items Grid */}
      {portfolioItems.length > 0 ? (
        <PortfolioGridProfile
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
              href={`${getCreatorUrl(user)}/collections/${collection.id}/edit`}
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
