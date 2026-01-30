import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { PortfolioShareButton } from "@/components/portfolio-share-button";
import { PortfolioFilters } from "@/components/portfolio-filters";
import { HintPopover } from "@/components/hint-popover";
import { getTutorialData } from "@/lib/get-tutorial-data";
import { getNextPageHint } from "@/lib/hints-helper";
import { getCreatorUrl } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PortfolioPageProps {
  params: Promise<{ creatorid: string }>;
  searchParams: Promise<{
    shareStatus?: string | string[];
    tag?: string | string[];
    category?: string | string[];
  }>;
}

async function getUser(creatorid: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  return user;
}

export async function generateMetadata({
  params,
}: PortfolioPageProps): Promise<Metadata> {
  const { creatorid } = await params;
  const user = await getUser(creatorid);
  const t = await getTranslations("profile");

  if (!user) {
    return {
      title: `${t("portfolioNotFound")} | Create Spot`,
    };
  }

  const creatorName = user.name || t("anonymous");
  const pageTitle = `${t("portfolioTitle", { name: creatorName })} | Create Spot`;
  const description = t("portfolioDescription", { name: creatorName });

  // Generate absolute OG image URL
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const ogImageUrl = `${baseUrl}/creators/${creatorid}/portfolio/opengraph-image`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      images: [ogImageUrl],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function PortfolioPage({
  params,
  searchParams,
}: PortfolioPageProps) {
  const { creatorid } = await params;
  const resolvedSearchParams = await searchParams;
  const [session, t, user] = await Promise.all([
    auth(),
    getTranslations("profile"),
    prisma.user.findFirst({
      where: {
        OR: [{ slug: creatorid }, { id: creatorid }],
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
    }),
  ]);

  if (!user) {
    notFound();
  }

  const isOwnPortfolio = session?.user?.id === user.id;
  const isLoggedIn = !!session?.user;

  // Parse shareStatus from search params (can be string or array)
  const shareStatusParam = resolvedSearchParams.shareStatus;
  const selectedShareStatuses = Array.isArray(shareStatusParam)
    ? shareStatusParam
    : shareStatusParam
      ? [shareStatusParam]
      : [];

  // Validate share status values
  const validShareStatuses = ["PRIVATE", "PROFILE", "PUBLIC"];
  const filteredShareStatuses = selectedShareStatuses.filter((status) =>
    validShareStatuses.includes(status),
  ) as ("PRIVATE" | "PROFILE" | "PUBLIC")[];

  // Parse tags from search params (can be string or array)
  const tagParam = resolvedSearchParams.tag;
  const selectedTags = Array.isArray(tagParam)
    ? tagParam
    : tagParam
      ? [tagParam]
      : [];

  // Parse categories from search params (can be string or array)
  const categoryParam = resolvedSearchParams.category;
  const selectedCategories = Array.isArray(categoryParam)
    ? categoryParam
    : categoryParam
      ? [categoryParam]
      : [];

  // Build share status filter based on ownership and search params
  let shareStatusFilter: {
    shareStatus?: { in: ("PRIVATE" | "PROFILE" | "PUBLIC")[] };
  } = {};

  if (isOwnPortfolio) {
    // Owner can filter by share status if provided, otherwise sees all
    if (filteredShareStatuses.length > 0) {
      shareStatusFilter = { shareStatus: { in: filteredShareStatuses } };
    }
  } else {
    // Others see PROFILE and PUBLIC only
    shareStatusFilter = {
      shareStatus: { in: ["PROFILE" as const, "PUBLIC" as const] },
    };
  }

  // Build tag filter
  let tagFilter: { tags?: { hasSome: string[] } } = {};
  if (selectedTags.length > 0) {
    tagFilter = { tags: { hasSome: selectedTags } };
  }

  // Build category filter
  let categoryFilter: { category?: { in: string[] } } = {};
  if (selectedCategories.length > 0) {
    categoryFilter = { category: { in: selectedCategories } };
  }

  // Get available categories, portfolio items, and tutorial data in parallel
  const [portfolioItemsForCategories, portfolioItems, tutorialData] =
    await Promise.all([
      prisma.submission.findMany({
        where: {
          userId: user.id,
          isPortfolio: true,
          ...shareStatusFilter,
        },
        select: { category: true },
        distinct: ["category"],
      }),
      prisma.submission.findMany({
        where: {
          userId: user.id,
          isPortfolio: true,
          ...shareStatusFilter,
          ...tagFilter,
          ...categoryFilter,
        },
        orderBy: [{ portfolioOrder: "asc" }, { createdAt: "desc" }],
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
      }),
      getTutorialData(session?.user?.id),
    ]);

  const availableCategories = portfolioItemsForCategories
    .map((item) => item.category)
    .filter((cat): cat is string => Boolean(cat))
    .sort((a, b) => a.localeCompare(b));

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
                <div className="flex items-center gap-3 min-w-0">
                  <span className="break-words min-w-0">
                    {user.name
                      ? t("portfolioTitle", { name: user.name })
                      : t("portfolio")}
                  </span>
                  {/* Share button - hidden on mobile, shown in action buttons below */}
                  <div className="hidden md:block shrink-0">
                    <PortfolioShareButton userId={user.id} />
                  </div>
                </div>
              }
              subtitle={`${portfolioItems.length} ${
                portfolioItems.length !== 1 ? t("works") : t("work")
              }`}
              rightContent={undefined}
            />
          </div>
        </div>
        {/* Mobile action buttons - shown below header on mobile */}
        <div className="md:hidden mt-4 flex flex-wrap items-center gap-2">
          <PortfolioShareButton userId={user.id} />
          {isOwnPortfolio && (
            <Button asChild variant="outline" size="sm">
              <Link href={`${getCreatorUrl(user)}/portfolio/edit`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">{t("managePortfolio")}</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters (only for own portfolio) */}
      {isOwnPortfolio && (
        <PortfolioFilters
          initialShareStatus={filteredShareStatuses}
          initialTags={selectedTags}
          initialCategories={selectedCategories}
          categories={availableCategories}
          userId={user.id}
        />
      )}

      {/* Portfolio Grid */}
      {portfolioItems.length > 0 ? (
        <PortfolioGrid
          items={portfolioItems.map((item) => ({
            ...item,
            imageFocalPoint: item.imageFocalPoint as {
              x: number;
              y: number;
            } | null,
            shareStatus: item.shareStatus,
          }))}
          isLoggedIn={isLoggedIn}
          isOwnProfile={isOwnPortfolio}
          user={{
            id: user.id,
            name: user.name,
            image: user.image,
          }}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {isOwnPortfolio ? t("portfolioEmpty") : t("noPortfolioItems")}
          </p>
          {isOwnPortfolio && (
            <Link
              href={`${getCreatorUrl(user)}/portfolio/edit`}
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("addPortfolioItem")}
            </Link>
          )}
        </div>
      )}

      {/* Page Hints */}
      {session?.user &&
        tutorialData &&
        (() => {
          // Get the next hint to show using the helper
          // The helper looks up hints from centralized config and handles all logic
          const nextHint = getNextPageHint(
            tutorialData,
            "portfolio-view",
            t,
            "profile",
          );

          return nextHint ? (
            <HintPopover
              hintKey={nextHint.key}
              page="portfolio-view"
              title={nextHint.title}
              description={nextHint.description}
              shouldShow={true}
              order={nextHint.order}
              showArrow={nextHint.showArrow ?? false}
              fixedPosition={nextHint.fixedPosition}
              targetSelector={nextHint.targetSelector}
              side={nextHint.side}
            />
          ) : null;
        })()}
    </PageLayout>
  );
}
