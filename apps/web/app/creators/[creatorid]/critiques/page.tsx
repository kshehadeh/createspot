import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCreator } from "@/lib/creators";
import { getCreatorUrl } from "@/lib/utils";
import { buildRoutePath } from "@/lib/routes";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface CreatorCritiquesPageProps {
  params: Promise<{ creatorid: string }>;
}

export async function generateMetadata({
  params,
}: CreatorCritiquesPageProps): Promise<Metadata> {
  const { creatorid } = await params;
  const creatorUser = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: { name: true },
  });

  if (!creatorUser) {
    return { title: "Creator Not Found | Create Spot" };
  }

  const creatorName = creatorUser.name || "Creator";
  const t = await getTranslations("critique");
  const pageTitle = `${t("allCritiques")} | ${creatorName} | Create Spot`;

  return {
    title: pageTitle,
    description: t("allCritiquesDescription"),
  };
}

export default async function CreatorCritiquesListPage({
  params,
}: CreatorCritiquesPageProps) {
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
    select: { id: true, name: true, slug: true },
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
  const tExhibition = await getTranslations("exhibition");
  const creatorUrl = getCreatorUrl(creatorUser);

  return (
    <PageLayout maxWidth="max-w-6xl">
      <PageHeader
        title={t("allCritiques")}
        subtitle={
          rows.length === 0
            ? undefined
            : t("submissionsWithCritiquesCount", { count: rows.length })
        }
      />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-muted-foreground">
          <p className="mb-4">{t("noSubmissionsWithCritiques")}</p>
          <Button variant="outline" asChild>
            <Link href={`${creatorUrl}/portfolio`}>{t("viewPortfolio")}</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("submissionName")}</TableHead>
                <TableHead className="w-32 text-right">
                  {t("critiquers")}
                </TableHead>
                <TableHead className="w-40 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`${creatorUrl}/s/${row.id}`}
                      className="font-medium hover:underline"
                    >
                      {row.title || tExhibition("untitled")}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.critiquerCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={buildRoutePath("submissionCritiques", {
                          creatorid,
                          submissionid: row.id,
                        })}
                      >
                        {t("viewCritiques")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageLayout>
  );
}
