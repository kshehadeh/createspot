import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "@/components/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCreator } from "@/lib/creators";
import { getCreatorUrl } from "@/lib/utils";
import { CreatorCritiquesSubmissionsTable } from "@/components/creator-critiques-submissions-table";
import { PageLayout } from "@/components/page-layout";
import { PageTitle } from "@/components/page-title";
import { Button } from "@createspot/ui-primitives/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CreatorCritiquesPageProps {
  params: Promise<{ creatorid: string }>;
}

export async function generateMetadata({
  params,
}: CreatorCritiquesPageProps): Promise<Metadata> {
  const { creatorid } = await params;
  const creator = await getCreator(creatorid);

  if (!creator) {
    return { title: "Creator Not Found | Create Spot" };
  }

  const creatorName = creator.name || "Creator";

  return {
    title: `Critiques | ${creatorName} | Create Spot`,
    description: "View and manage critiques on your submissions",
  };
}

async function CreatorCritiquesContent({ params }: CreatorCritiquesPageProps) {
  const { creatorid } = await params;
  const [session, creator] = await Promise.all([auth(), getCreator(creatorid)]);

  if (!session?.user) {
    redirect("/welcome");
  }

  if (!creator) {
    notFound();
  }

  const isOwner = session.user.id === creator.id;
  if (!isOwner) {
    notFound();
  }

  const creatorUser = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: { id: true, name: true, slug: true, image: true },
  });

  if (!creatorUser) {
    notFound();
  }

  const submissionsWithCritiques = await prisma.submission.findMany({
    where: {
      userId: creatorUser.id,
      critiques: { some: {} },
    },
    select: {
      id: true,
      title: true,
      critiques: { select: { critiquerId: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows = submissionsWithCritiques.map((submission) => ({
    id: submission.id,
    title: submission.title,
    critiquerCount: new Set(submission.critiques.map((c) => c.critiquerId))
      .size,
  }));

  const t = await getTranslations("critique");
  const creatorUrl = getCreatorUrl(creatorUser);

  return (
    <PageLayout maxWidth="max-w-6xl">
      <div className="mb-8 w-full">
        <div className="flex items-start gap-4">
          {creatorUser.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creatorUser.image}
              alt={creatorUser.name || "User"}
              className="h-12 w-12 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface-lowest">
              <span className="text-lg font-medium text-on-surface-variant">
                {creatorUser.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <PageTitle>{t("allCritiques")}</PageTitle>
            {rows.length > 0 && (
              <p className="mt-2 text-sm text-on-surface-variant sm:text-base">
                {t("submissionsWithCritiquesCount", { count: rows.length })}
              </p>
            )}
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl bg-surface-container px-6 py-12 text-center text-on-surface-variant shadow-[0_14px_35px_rgb(0_0_0_/_0.35)]">
          <p className="mb-4">{t("noSubmissionsWithCritiques")}</p>
          <Button variant="outline" asChild>
            <Link href={`${creatorUrl}/portfolio`}>{t("viewPortfolio")}</Link>
          </Button>
        </div>
      ) : (
        <CreatorCritiquesSubmissionsTable
          rows={rows}
          creatorUrl={creatorUrl}
          creatorid={creatorid}
        />
      )}
    </PageLayout>
  );
}

export default async function CreatorCritiquesListPage({
  params,
}: CreatorCritiquesPageProps) {
  return (
    <Suspense
      fallback={
        <PageLayout maxWidth="max-w-6xl">
          <div className="mb-8 space-y-2">
            <Skeleton className="h-9 w-48 max-w-full" />
            <Skeleton className="h-5 w-72 max-w-full" />
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </PageLayout>
      }
    >
      <CreatorCritiquesContent params={params} />
    </Suspense>
  );
}
