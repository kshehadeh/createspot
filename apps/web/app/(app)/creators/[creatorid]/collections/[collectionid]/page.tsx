import { Globe, Lock, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "@/components/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CollectionDownloadDropdown } from "@/components/collection-download-dropdown";
import { PageLayout } from "@/components/page-layout";
import { PageTitle } from "@/components/page-title";
import { PortfolioGridProfile } from "@/components/portfolio-grid";
import { SketchbookView } from "@/components/sketchbook/sketchbook-view";
import { ShareButton } from "@/components/share-button";
import { Button, buttonVariants } from "@createspot/ui-primitives/button";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { getCollectionMetadata } from "@/lib/og-metadata";
import { prisma } from "@/lib/prisma";
import { getCreatorUrl } from "@/lib/utils";

interface CollectionViewPageProps {
  params: Promise<{ creatorid: string; collectionid: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
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
  searchParams,
}: CollectionViewPageProps) {
  const { creatorid, collectionid } = await params;
  const paramsSearch = await searchParams;
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
                _count: {
                  select: {
                    favorites: true,
                    comments: { where: { deletedAt: null } },
                  },
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
  const defaultViewType =
    collection.defaultViewType === "sketchbook" ? "sketchbook" : "gallery";
  const requestedView = Array.isArray(paramsSearch.view)
    ? paramsSearch.view[0]
    : paramsSearch.view;
  const activeView =
    requestedView === "gallery" || requestedView === "sketchbook"
      ? requestedView
      : defaultViewType;
  const activeCollectionPath = `${getCreatorUrl(user)}/collections/${collection.id}`;

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
      _count: cs.submission._count,
      shareStatus: cs.submission.shareStatus,
      latestProgressionImageUrl: latest?.imageUrl ?? null,
      latestProgressionText: latest?.text ?? null,
    };
  });
  const sketchbookItems = portfolioItems.map((item) => ({
    id: item.id,
    title: item.title,
    imageUrl: item.imageUrl,
    imageFocalPoint: item.imageFocalPoint,
    text: item.text,
    authorName: user.name,
    href: `${getCreatorUrl(user)}/s/${item.id}`,
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-lowest shrink-0">
              <span className="text-lg font-medium text-on-surface-variant">
                {user.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <PageTitle>
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <span className="truncate">{collection.name}</span>
                      {collection.isPublic ? (
                        <Globe className="h-4 w-4 shrink-0 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 shrink-0 text-on-surface-variant" />
                      )}
                    </span>
                  </PageTitle>
                  <p className="mt-2 text-sm text-on-surface-variant sm:text-base">
                    {user.name && (
                      <span>
                        {t("by", { name: user.name })}
                        {" · "}
                      </span>
                    )}
                    {collection._count.submissions}{" "}
                    {collection._count.submissions !== 1
                      ? t("items")
                      : t("item")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 pt-0.5">
                  <div className="flex items-center rounded-md border border-border p-0.5">
                    <Button
                      asChild
                      variant={activeView === "gallery" ? "default" : "ghost"}
                      size="sm"
                      className="h-8"
                    >
                      <Link href={activeCollectionPath}>{t("grid")}</Link>
                    </Button>
                    <Button
                      asChild
                      variant={
                        activeView === "sketchbook" ? "default" : "ghost"
                      }
                      size="sm"
                      className="h-8"
                    >
                      <Link href={`${activeCollectionPath}?view=sketchbook`}>
                        {t("sketchbook")}
                      </Link>
                    </Button>
                  </div>
                  {collection.isPublic && (
                    <ShareButton
                      type="collection"
                      userId={user.id}
                      slug={user.slug}
                      collectionId={collection.id}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "icon" }),
                        "shrink-0",
                      )}
                    />
                  )}
                  {isOwner && portfolioItems.length > 0 && (
                    <CollectionDownloadDropdown
                      variant="collection"
                      collectionId={collection.id}
                      collectionName={collection.name}
                      toolbarIconTrigger
                    />
                  )}
                  {isOwner && (
                    <Button
                      asChild
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                    >
                      <Link
                        href={`${getCreatorUrl(user)}/collections/${collection.id}/edit`}
                        aria-label={t("edit")}
                        title={t("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {collection.description && (
          <p className="mt-4 text-on-surface-variant">
            {collection.description}
          </p>
        )}
      </div>

      {/* Collection Items Grid */}
      {portfolioItems.length > 0 ? (
        activeView === "sketchbook" ? (
          <SketchbookView
            items={sketchbookItems}
            emptyStateLabel={t("emptyCollection")}
            openLabel={t("openSubmission")}
            previousLabel={t("previousPage")}
            nextLabel={t("nextPage")}
          />
        ) : (
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
        )
      ) : (
        <div className="rounded-xl bg-surface-container py-16 text-center shadow-[0_14px_35px_rgb(0_0_0_/_0.35)]">
          <p className="text-on-surface-variant">{t("emptyCollection")}</p>
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
