import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HintPopover } from "@/components/hint-popover";
import { PageHeader } from "@/components/page-header";
import { PageLayout } from "@/components/page-layout";
import { PortfolioFilters } from "@/components/portfolio-filters";
import { PortfolioGridProfile } from "@/components/portfolio-grid";
import { PortfolioMobileMenu } from "@/components/portfolio-mobile-menu";
import { PortfolioPageBody } from "@/components/portfolio-page-body";
import { ShareButton } from "@/components/share-button";
import { auth } from "@/lib/auth";
import { getTutorialData } from "@/lib/get-tutorial-data";
import { getNextPageHint } from "@/lib/hints-helper";
import {
  buildPortfolioOrderBy,
  buildPortfolioSearchWhere,
  parsePortfolioSortParam,
  portfolioSortAllowsReorder,
} from "@/lib/portfolio-page-query";
import { prisma } from "@/lib/prisma";
interface PortfolioPageProps {
  params: Promise<{ creatorid: string }>;
  searchParams: Promise<{
    shareStatus?: string | string[];
    tag?: string | string[];
    category?: string | string[];
    q?: string | string[];
    sort?: string | string[];
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
  await connection();
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
  await connection();
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
        slug: true,
        featuredSubmissionId: true,
      },
    }),
  ]);

  if (!user) {
    notFound();
  }

  const isOwnPortfolio = session?.user?.id === user.id;
  const isLoggedIn = !!session?.user;

  const shareStatusParam = resolvedSearchParams.shareStatus;
  const selectedShareStatuses = Array.isArray(shareStatusParam)
    ? shareStatusParam
    : shareStatusParam
      ? [shareStatusParam]
      : [];

  const validShareStatuses = ["PRIVATE", "PROFILE", "PUBLIC"];
  const filteredShareStatuses = selectedShareStatuses.filter((status) =>
    validShareStatuses.includes(status),
  ) as ("PRIVATE" | "PROFILE" | "PUBLIC")[];

  const tagParam = resolvedSearchParams.tag;
  const selectedTags = Array.isArray(tagParam)
    ? tagParam
    : tagParam
      ? [tagParam]
      : [];

  const categoryParam = resolvedSearchParams.category;
  const selectedCategories = Array.isArray(categoryParam)
    ? categoryParam
    : categoryParam
      ? [categoryParam]
      : [];

  const qParam = resolvedSearchParams.q;
  const qRaw = Array.isArray(qParam) ? qParam[0] : qParam;
  const qTrimmed = qRaw?.trim() ?? "";

  const sort = parsePortfolioSortParam(resolvedSearchParams.sort);
  const sortAllowsReorder = portfolioSortAllowsReorder(sort);
  const orderBy = buildPortfolioOrderBy(sort);
  const searchWhere = buildPortfolioSearchWhere(qTrimmed || undefined);

  let shareStatusFilter: {
    shareStatus?: { in: ("PRIVATE" | "PROFILE" | "PUBLIC")[] };
  } = {};

  if (isOwnPortfolio) {
    if (filteredShareStatuses.length > 0) {
      shareStatusFilter = { shareStatus: { in: filteredShareStatuses } };
    }
  } else {
    shareStatusFilter = {
      shareStatus: { in: ["PROFILE" as const, "PUBLIC" as const] },
    };
  }

  let tagFilter: { tags?: { hasSome: string[] } } = {};
  if (selectedTags.length > 0) {
    tagFilter = { tags: { hasSome: selectedTags } };
  }

  let categoryFilter: { category?: { in: string[] } } = {};
  if (selectedCategories.length > 0) {
    categoryFilter = { category: { in: selectedCategories } };
  }

  const portfolioWhereBase = {
    userId: user.id,
    isPortfolio: true,
    ...shareStatusFilter,
    ...tagFilter,
    ...categoryFilter,
    ...searchWhere,
  };

  const [
    portfolioItemsForCategories,
    portfolioItems,
    tutorialData,
    submissionsForAddWork,
  ] = await Promise.all([
    prisma.submission.findMany({
      where: {
        userId: user.id,
        isPortfolio: true,
        ...shareStatusFilter,
      },
      select: { category: true },
      distinct: ["category"],
    }),
    prisma.submission
      .findMany({
        where: portfolioWhereBase,
        orderBy,
        include: {
          _count: {
            select: { favorites: true },
          },
          progressions: {
            orderBy: { order: "desc" },
            take: 1,
            select: {
              imageUrl: true,
              text: true,
            },
          },
        },
      })
      .then((items) =>
        items.map((item) => {
          const latest = item.progressions?.[0];
          return {
            ...item,
            latestProgressionImageUrl: latest?.imageUrl ?? null,
            latestProgressionText: latest?.text ?? null,
            progressions: undefined,
          };
        }),
      ),
    getTutorialData(session?.user?.id),
    isOwnPortfolio
      ? prisma.submission.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            title: true,
            imageUrl: true,
            imageFocalPoint: true,
            text: true,
            isPortfolio: true,
            tags: true,
            category: true,
            shareStatus: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const availableCategories = portfolioItemsForCategories
    .map((item) => item.category)
    .filter((cat): cat is string => Boolean(cat))
    .sort((a, b) => a.localeCompare(b));

  const portfolioTitle = user.name
    ? t("portfolioTitle", { name: user.name })
    : t("portfolio");

  const filterProps = {
    initialShareStatus: filteredShareStatuses,
    initialTags: selectedTags,
    initialCategories: selectedCategories,
    initialQ: qTrimmed,
    initialSort: sort,
    categories: availableCategories,
    userId: user.id,
    showShareStatusFilter: isOwnPortfolio,
  };

  const gridItems = portfolioItems.map((item) => ({
    ...item,
    imageFocalPoint: item.imageFocalPoint as {
      x: number;
      y: number;
    } | null,
    shareStatus: item.shareStatus,
  }));

  const userForGrid = {
    id: user.id,
    slug: user.slug,
    name: user.name,
    image: user.image,
  };

  return (
    <PageLayout maxWidth="max-w-6xl">
      {!isOwnPortfolio && (
        <div className="md:hidden mb-4 w-full">
          <PortfolioMobileMenu
            title={portfolioTitle}
            userId={user.id}
            filterProps={filterProps}
          />
        </div>
      )}

      <div className="hidden md:block mb-8 w-full">
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
                  <span className="break-words min-w-0">{portfolioTitle}</span>
                  <div className="shrink-0">
                    <ShareButton type="portfolio" userId={user.id} />
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
      </div>

      <div className="hidden md:block">
        <PortfolioFilters {...filterProps} />
      </div>

      {isOwnPortfolio ? (
        <PortfolioPageBody
          items={gridItems}
          isLoggedIn={isLoggedIn}
          isOwnPortfolio={true}
          user={userForGrid}
          featuredSubmissionId={user.featuredSubmissionId}
          sortAllowsReorder={sortAllowsReorder}
          portfolioTitle={portfolioTitle}
          filterProps={filterProps}
          submissionsForAddWork={
            submissionsForAddWork?.map((s) => ({
              ...s,
              imageFocalPoint: s.imageFocalPoint as {
                x: number;
                y: number;
              } | null,
            })) ?? []
          }
        />
      ) : portfolioItems.length > 0 ? (
        <PortfolioGridProfile
          items={gridItems}
          isLoggedIn={isLoggedIn}
          isOwnProfile={false}
          user={userForGrid}
        />
      ) : (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">{t("noPortfolioItems")}</p>
        </div>
      )}

      {session?.user &&
        tutorialData &&
        (() => {
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
