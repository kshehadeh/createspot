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
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface PortfolioPageProps {
  params: Promise<{ userId: string }>;
}

async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
  const { userId } = await params;
  const user = await getUser(userId);
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
  const ogImageUrl = `${baseUrl}/portfolio/${userId}/opengraph-image`;

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

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { userId } = await params;
  const session = await auth();
  const t = await getTranslations("profile");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  if (!user) {
    notFound();
  }

  const isOwnPortfolio = session?.user?.id === user.id;
  const isLoggedIn = !!session?.user;

  // Build share status filter based on ownership
  const shareStatusFilter = isOwnPortfolio
    ? {} // Owner sees all their items
    : { shareStatus: { in: ["PROFILE" as const, "PUBLIC" as const] } };

  // Fetch portfolio items
  const portfolioItems = await prisma.submission.findMany({
    where: {
      userId: user.id,
      isPortfolio: true,
      ...shareStatusFilter,
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
                <div className="flex items-center gap-3">
                  <span className="truncate">
                    {user.name
                      ? t("portfolioTitle", { name: user.name })
                      : t("portfolio")}
                  </span>
                  <PortfolioShareButton userId={user.id} />
                </div>
              }
              subtitle={`${portfolioItems.length} ${
                portfolioItems.length !== 1 ? t("works") : t("work")
              }`}
              rightContent={
                <div className="flex flex-row flex-wrap items-end justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/profile/${user.id}`}>
                      <Eye className="h-4 w-4" />
                      <span className="hidden md:inline">
                        {t("viewProfile")}
                      </span>
                    </Link>
                  </Button>
                  {isOwnPortfolio && (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/portfolio/edit">
                        <Pencil className="h-4 w-4" />
                        <span className="hidden md:inline">
                          {t("managePortfolio")}
                        </span>
                      </Link>
                    </Button>
                  )}
                </div>
              }
            />
          </div>
        </div>
      </div>

      {/* Portfolio Grid */}
      {portfolioItems.length > 0 ? (
        <PortfolioGrid
          items={portfolioItems.map((item) => ({
            ...item,
            imageFocalPoint: item.imageFocalPoint as {
              x: number;
              y: number;
            } | null,
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
              href="/portfolio/edit"
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("addPortfolioItem")}
            </Link>
          )}
        </div>
      )}
    </PageLayout>
  );
}
