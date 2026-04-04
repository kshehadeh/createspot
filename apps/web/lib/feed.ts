import { prisma } from "@/lib/prisma";

const FEED_PAGE_SIZE = 20;

export interface FeedSubmission {
  id: string;
  title: string | null;
  imageUrl: string | null;
  imageFocalPoint: { x: number; y: number } | null;
  text: string | null;
  referenceImageUrl: string | null;
  category: string | null;
  tags: string[];
  critiquesEnabled: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    profileImageUrl: string | null;
    slug: string | null;
  };
  progressions: {
    id: string;
    imageUrl: string | null;
    text: string | null;
    comment: string | null;
    order: number;
  }[];
  _count: {
    favorites: number;
  };
}

export interface FeedResult {
  submissions: FeedSubmission[];
  hasMore: boolean;
  nextCursor: string | null;
}

export async function getFeedSubmissions({
  cursor,
  take = FEED_PAGE_SIZE,
  currentUserId,
}: {
  cursor?: string;
  take?: number;
  currentUserId?: string | null;
}): Promise<FeedResult> {
  // Get followed user IDs for prioritization
  let followedUserIds: string[] = [];
  if (currentUserId) {
    const follows = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    followedUserIds = follows.map((f) => f.followingId);
  }

  const baseWhere = {
    shareStatus: "PUBLIC" as const,
    isPortfolio: true,
    OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
  };

  // If we have followed users, fetch followed-first then others
  // We do two queries and merge, keeping at most `take + 1` total
  let submissions: FeedSubmission[] = [];

  if (followedUserIds.length > 0) {
    // Fetch followed users' posts first
    const followedItems = await prisma.submission.findMany({
      where: { ...baseWhere, userId: { in: followedUserIds } },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: submissionInclude,
    });

    // Fetch non-followed posts
    const nonFollowedItems = await prisma.submission.findMany({
      where: { ...baseWhere, userId: { notIn: followedUserIds } },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: submissionInclude,
    });

    // Interleave: prioritize followed (3:1 ratio) then fill with others
    const merged = interleave(followedItems, nonFollowedItems, take + 1);
    submissions = merged as unknown as FeedSubmission[];
  } else {
    const items = await prisma.submission.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: submissionInclude,
    });
    submissions = items as unknown as FeedSubmission[];
  }

  const hasMore = submissions.length > take;
  if (hasMore) {
    submissions = submissions.slice(0, take);
  }

  const nextCursor =
    hasMore && submissions.length > 0
      ? submissions[submissions.length - 1].id
      : null;

  return { submissions, hasMore, nextCursor };
}

/**
 * Interleave two arrays prioritizing `a` (followed), placing 3 from `a` then 1 from `b`,
 * until we've collected `limit` items.
 */
function interleave<T>(a: T[], b: T[], limit: number): T[] {
  const result: T[] = [];
  let ai = 0;
  let bi = 0;
  let cycle = 0;

  while (result.length < limit && (ai < a.length || bi < b.length)) {
    if (cycle < 3 && ai < a.length) {
      result.push(a[ai++]);
      cycle++;
    } else if (bi < b.length) {
      result.push(b[bi++]);
      cycle = 0;
    } else if (ai < a.length) {
      result.push(a[ai++]);
      cycle++;
    } else {
      break;
    }
  }

  return result;
}

const submissionInclude = {
  user: {
    select: {
      id: true,
      name: true,
      image: true,
      profileImageUrl: true,
      slug: true,
    },
  },
  progressions: {
    orderBy: { order: "asc" as const },
    select: {
      id: true,
      imageUrl: true,
      text: true,
      comment: true,
      order: true,
    },
  },
  _count: {
    select: { favorites: true },
  },
} as const;
