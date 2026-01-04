import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "./prisma";
import { EXHIBITION_PAGE_SIZE } from "./exhibition-constants";

export interface ExhibitionFilterInput {
  category?: string;
  tag?: string;
  query?: string;
}

export function buildExhibitionWhere({
  category,
  tag,
  query,
}: ExhibitionFilterInput): Prisma.SubmissionWhereInput {
  const filters: Prisma.SubmissionWhereInput[] = [
    {
      OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
    },
  ];

  if (category) {
    filters.push({ category });
  }

  if (tag) {
    filters.push({ tags: { has: tag } });
  }

  if (query) {
    filters.push({
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { text: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
        { tags: { has: query } },
      ],
    });
  }

  return {
    shareStatus: "PUBLIC",
    AND: filters,
  };
}

const submissionInclude = {
  user: {
    select: { id: true, name: true, image: true },
  },
  prompt: {
    select: { word1: true, word2: true, word3: true },
  },
  _count: {
    select: { favorites: true },
  },
} satisfies Prisma.SubmissionInclude;

export async function getExhibitionSubmissions({
  category,
  tag,
  query,
  skip = 0,
  take = EXHIBITION_PAGE_SIZE,
}: ExhibitionFilterInput & { skip?: number; take?: number }) {
  const limit = Math.max(1, Math.min(take, 30));
  const submissions = await prisma.submission.findMany({
    where: buildExhibitionWhere({ category, tag, query }),
    orderBy: { createdAt: "desc" },
    include: submissionInclude,
    skip,
    take: limit + 1,
  });

  const hasMore = submissions.length > limit;

  return {
    submissions: submissions.slice(0, limit),
    hasMore,
  };
}

export async function getExhibitionFacets() {
  const [categoryRows, tagRows] = await Promise.all([
    prisma.submission.findMany({
      where: { shareStatus: "PUBLIC", category: { not: null } },
      distinct: ["category"],
      select: { category: true },
    }),
    prisma.submission.findMany({
      where: { shareStatus: "PUBLIC", tags: { isEmpty: false } },
      select: { tags: true },
    }),
  ]);

  const categories = categoryRows
    .map((row) => row.category)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => a.localeCompare(b));

  const tags = Array.from(
    new Set(tagRows.flatMap((row) => row.tags)),
  ).sort((a, b) => a.localeCompare(b));

  return { categories, tags };
}
