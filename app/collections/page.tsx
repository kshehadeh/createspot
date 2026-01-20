import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { CollectionCard } from "@/components/collection-card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CollectionCreateButton } from "./collection-create-button";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collections");
  return {
    title: `${t("myCollections")} | Create Spot`,
  };
}

export default async function MyCollectionsPage() {
  const session = await auth();
  const t = await getTranslations("collections");
  const tProfile = await getTranslations("profile");

  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
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
        <PageHeader
          title={t("myCollections")}
          subtitle={`${collections.length} ${
            collections.length !== 1 ? t("collections") : t("collection")
          }`}
          rightContent={
            <div className="flex flex-row flex-wrap items-end justify-end gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/portfolio/${session.user.id}`}>
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden md:inline">
                    {tProfile("portfolio")}
                  </span>
                </Link>
              </Button>
              <CollectionCreateButton userId={session.user.id} />
            </div>
          }
        />
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
              isOwner={true}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">{t("noCollectionsOwner")}</p>
          <CollectionCreateButton
            userId={session.user.id}
            variant="primary"
            className="mt-4"
          />
        </div>
      )}
    </PageLayout>
  );
}
