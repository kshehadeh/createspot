import type { Prisma } from "@/app/generated/prisma/client";
import { unstable_noStore } from "next/cache";
import { prisma } from "./prisma";
import { EXHIBITION_PAGE_SIZE } from "./exhibition-constants";

export interface ExhibitionFilterInput {
  category?: string; // Deprecated: use categories instead
  categories?: string[];
  tag?: string; // Deprecated: use tags instead
  tags?: string[];
  query?: string;
  exhibitId?: string;
  userId?: string;
}

function buildExhibitionWhere({
  category,
  categories,
  tag,
  tags,
  query,
  exhibitId,
  userId,
}: ExhibitionFilterInput): Prisma.SubmissionWhereInput {
  const filters: Prisma.SubmissionWhereInput[] = [
    {
      OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
    },
  ];

  // If exhibitId is provided, filter to only submissions in that exhibit
  if (exhibitId) {
    filters.push({
      exhibitSubmissions: {
        some: {
          exhibitId,
        },
      },
    });
  } else {
    // For permanent collection (no exhibitId), only show portfolio items
    filters.push({ isPortfolio: true });
  }

  // If userId is provided, filter to only submissions by that user
  if (userId) {
    filters.push({ userId });
  }

  // Support both single category (for backward compatibility) and multiple categories
  const categoryList =
    categories && categories.length > 0
      ? categories
      : category
        ? [category]
        : [];
  if (categoryList.length > 0) {
    filters.push({ category: { in: categoryList } });
  }

  // Support both single tag (for backward compatibility) and multiple tags
  const tagList = tags && tags.length > 0 ? tags : tag ? [tag] : [];
  if (tagList.length > 0) {
    filters.push({ tags: { hasSome: tagList } });
  }

  if (query) {
    filters.push({
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { text: { contains: query, mode: "insensitive" } },
        { category: { contains: query, mode: "insensitive" } },
        { tags: { has: query } },
        { user: { name: { contains: query, mode: "insensitive" } } },
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
  categories,
  tag,
  tags,
  query,
  exhibitId,
  userId,
  skip = 0,
  take = EXHIBITION_PAGE_SIZE,
}: ExhibitionFilterInput & { skip?: number; take?: number }) {
  unstable_noStore();
  const limit = Math.max(1, Math.min(take, 30));

  // If exhibitId is provided, we need to order by exhibit submission order
  const whereClause = buildExhibitionWhere({
    category,
    categories,
    tag,
    tags,
    query,
    exhibitId,
    userId,
  });

  let orderBy: Prisma.SubmissionOrderByWithRelationInput;
  if (exhibitId) {
    // For exhibits, order by the exhibit submission order
    // First, get all exhibit submissions for this exhibit, ordered
    const exhibitSubmissions = await prisma.exhibitSubmission.findMany({
      where: { exhibitId },
      select: {
        submissionId: true,
        order: true,
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "asc" }, // Secondary sort for consistency
      ],
    });

    const submissionIds = exhibitSubmissions.map((es) => es.submissionId);

    if (submissionIds.length === 0) {
      return {
        submissions: [],
        hasMore: false,
      };
    }

    // Build where clause without the exhibitId filter (we're already filtering by IDs)
    const whereClauseWithoutExhibit = buildExhibitionWhere({
      category,
      categories,
      tag,
      tags,
      query,
      userId,
    });

    // Remove the exhibitSubmissions filter since we're already filtering by IDs
    const filters = Array.isArray(whereClauseWithoutExhibit.AND)
      ? whereClauseWithoutExhibit.AND.filter(
          (filter: any) => !filter.exhibitSubmissions,
        )
      : [];

    // Fetch submissions that match the filters and are in the exhibit
    const submissions = await prisma.submission.findMany({
      where: {
        shareStatus: "PUBLIC",
        AND: [...filters, { id: { in: submissionIds } }],
      },
      include: submissionInclude,
    });

    // Sort by the order in submissionIds (maintaining exhibit order)
    const sortedSubmissions = submissionIds
      .map((id) => submissions.find((s) => s.id === id))
      .filter((s): s is (typeof submissions)[0] => s !== undefined);

    const hasMore = sortedSubmissions.length > limit;

    return {
      submissions: sortedSubmissions.slice(skip, skip + limit),
      hasMore,
    };
  } else {
    // Normal ordering for non-exhibit views
    orderBy = { createdAt: "desc" };
    const submissions = await prisma.submission.findMany({
      where: whereClause,
      orderBy,
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
}

export async function getExhibitionFacets(exhibitId?: string) {
  const baseWhere: Prisma.SubmissionWhereInput = {
    shareStatus: "PUBLIC",
  };

  // If exhibitId is provided, filter to only submissions in that exhibit
  if (exhibitId) {
    baseWhere.exhibitSubmissions = {
      some: {
        exhibitId,
      },
    };
  } else {
    // For permanent collection (no exhibitId), only show portfolio items
    baseWhere.isPortfolio = true;
  }

  const [categoryRows, tagRows] = await Promise.all([
    prisma.submission.findMany({
      where: { ...baseWhere, category: { not: null } },
      distinct: ["category"],
      select: { category: true },
    }),
    prisma.submission.findMany({
      where: { ...baseWhere, tags: { isEmpty: false } },
      select: { tags: true },
    }),
  ]);

  const categories = categoryRows
    .map((row) => row.category)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => a.localeCompare(b));

  const tags = Array.from(new Set(tagRows.flatMap((row) => row.tags))).sort(
    (a, b) => a.localeCompare(b),
  );

  return { categories, tags };
}
