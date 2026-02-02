import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageLayout } from "@/components/page-layout";
import { PageHeader } from "@/components/page-header";
import { CreatorsFilters } from "@/components/creators-filters";
import { CreatorsGrid } from "@/components/creators-grid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Creators | Create Spot",
  description:
    "Browse all creators on Create Spot. Discover artists and their creative work.",
  openGraph: {
    title: "Creators | Create Spot",
    description:
      "Browse all creators on Create Spot. Discover artists and their creative work.",
    type: "website",
  },
};

interface CreatorsPageProps {
  searchParams: Promise<{
    q?: string | string[];
  }>;
}

export default async function CreatorsPage({
  searchParams,
}: CreatorsPageProps) {
  const params = await searchParams;

  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = rawQuery?.trim() || "";

  const users = await prisma.user.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { bio: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
            { stateProvince: { contains: query, mode: "insensitive" } },
            { country: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      slug: true,
      name: true,
      profileImageUrl: true,
      image: true,
      _count: {
        select: {
          submissions: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <PageLayout>
      <PageHeader
        title="Creators"
        subtitle="Discover artists and creators on Create Spot"
      />

      <CreatorsFilters initialQuery={query} />

      <CreatorsGrid creators={users} />
    </PageLayout>
  );
}
