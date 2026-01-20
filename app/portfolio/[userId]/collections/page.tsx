import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { CollectionCard } from "@/components/collection-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

interface CollectionsPageProps {
  params: Promise<{ userId: string }>;
}

async function getUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });
}

export async function generateMetadata({
  params,
}: CollectionsPageProps): Promise<Metadata> {
  const { userId } = await params;
  const user = await getUser(userId);
  const t = await getTranslations("collections");

  if (!user) {
    return {
      title: `${t("notFound")} | Create Spot`,
    };
  }

  const creatorName = user.name || t("anonymous");
  const pageTitle = `${t("collectionsOf", { name: creatorName })} | Create Spot`;

  return {
    title: pageTitle,
    description: t("collectionsDescription", { name: creatorName }),
  };
}

export default async function CollectionsPage({
  params,
}: CollectionsPageProps) {
  const { userId } = await params;
  const session = await auth();
  const t = await getTranslations("collections");
  const tProfile = await getTranslations("profile");

  const user = await getUser(userId);

  if (!user) {
    notFound();
  }

  const isOwner = session?.user?.id === user.id;

  // Get collections - if owner, show all; otherwise only public
  const collections = await prisma.collection.findMany({
    where: {
      userId,
      ...(isOwner ? {} : { isPublic: true }),
    },
    include: {
      submissions: {
        orderBy: { order: "asc" },
        take: 1,
        include: {
          submission: {
            select: {
              id: true,
              imageUrl: true,
              imageFocalPoint: true,
              text: true,
              title: true,
            },
          },
        },
      },
      _count: {
        select: { submissions: true },
      },
    },
    orderBy: { updatedAt: "desc" },
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
                user.name
                  ? t("collectionsOf", { name: user.name })
                  : t("collections")
              }
              subtitle={`${collections.length} ${
                collections.length !== 1 ? t("collections") : t("collection")
              }`}
              rightContent={
                <div className="flex flex-row flex-wrap items-end justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/portfolio/${user.id}`}>
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden md:inline">
                        {tProfile("portfolio")}
                      </span>
                    </Link>
                  </Button>
                  {isOwner && (
                    <Button asChild variant="outline" size="sm">
                      <Link href="/collections">
                        <Pencil className="h-4 w-4" />
                        <span className="hidden md:inline">
                          {t("manageCollections")}
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

      {/* Collections Grid */}
      {collections.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={{
                ...collection,
                submissions: collection.submissions.map((s) => ({
                  submission: {
                    ...s.submission,
                    imageFocalPoint: s.submission.imageFocalPoint as {
                      x: number;
                      y: number;
                    } | null,
                  },
                })),
              }}
              isOwner={isOwner}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {isOwner ? t("noCollectionsOwner") : t("noCollections")}
          </p>
          {isOwner && (
            <Link
              href="/collections"
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("createFirst")}
            </Link>
          )}
        </div>
      )}
    </PageLayout>
  );
}
