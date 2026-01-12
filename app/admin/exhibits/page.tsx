import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { ExhibitGrid } from "./exhibit-grid";
import { ExhibitFilters } from "./exhibit-filters";
import { Button } from "@/components/ui/button";
import { isExhibitActive } from "@/lib/exhibit-utils";

export const dynamic = "force-dynamic";

interface AdminExhibitsPageProps {
  searchParams: Promise<{
    curator?: string | string[];
    status?: string | string[];
    q?: string | string[];
  }>;
}

export default async function AdminExhibitsPage({
  searchParams,
}: AdminExhibitsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  const t = await getTranslations("admin.exhibits");

  const params = await searchParams;
  const rawCurator = Array.isArray(params.curator)
    ? params.curator[0]
    : params.curator;
  const rawStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;

  const curatorId = rawCurator?.trim() || "";
  const status = rawStatus?.trim() || "";
  const query = rawQuery?.trim() || "";

  // Get all curators for the filter
  const allCurators = await prisma.user.findMany({
    where: {
      curatedExhibits: {
        some: {},
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Build where clause
  const where: any = {};

  if (curatorId) {
    where.curatorId = curatorId;
  }

  if (query) {
    where.title = {
      contains: query,
      mode: "insensitive",
    };
  }

  // Get all exhibits first, then filter by status client-side logic
  const allExhibits = await prisma.exhibit.findMany({
    where,
    orderBy: { startTime: "desc" },
    include: {
      curator: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      featuredSubmission: {
        select: {
          id: true,
          imageUrl: true,
          text: true,
        },
      },
      _count: {
        select: { submissions: true },
      },
    },
  });

  // Filter by status
  let filteredExhibits = allExhibits;
  if (status) {
    const now = new Date();
    filteredExhibits = allExhibits.filter((exhibit) => {
      if (status === "active") {
        return isExhibitActive(exhibit);
      } else if (status === "inactive") {
        return !isExhibitActive(exhibit);
      } else if (status === "upcoming") {
        return new Date(exhibit.startTime) > now && exhibit.isActive;
      }
      return true;
    });
  }

  return (
    <PageLayout maxWidth="max-w-7xl" className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t("pageTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/admin/exhibits/new">
          <Button>{t("createNew")}</Button>
        </Link>
      </div>

      <ExhibitFilters
        curators={allCurators}
        initialCurator={curatorId}
        initialStatus={status}
        initialQuery={query}
      />

      <ExhibitGrid exhibits={filteredExhibits} />
    </PageLayout>
  );
}
