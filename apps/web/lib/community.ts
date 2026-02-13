import type { Prisma } from "@/app/generated/prisma/client";
import type { ExhibitionSubmission } from "@/app/exhibition/exhibition-grid";
import { unstable_noStore } from "next/cache";
import { EXHIBITION_PAGE_SIZE } from "@/lib/exhibition-constants";
import { prisma } from "@/lib/prisma";

function normalizeFocalPoint(
  value: unknown,
): { x: number; y: number } | null | undefined {
  if (value == null) return value === null ? null : undefined;
  if (typeof value === "object" && "x" in value && "y" in value) {
    const x = (value as { x: unknown; y: unknown }).x;
    const y = (value as { x: unknown; y: unknown }).y;
    if (typeof x === "number" && typeof y === "number") {
      return { x, y };
    }
  }
  return null;
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

export async function getFollowingFeedSubmissions({
  userId,
  skip = 0,
  take = EXHIBITION_PAGE_SIZE,
}: {
  userId: string;
  skip?: number;
  take?: number;
}): Promise<{ submissions: ExhibitionSubmission[]; hasMore: boolean }> {
  unstable_noStore();
  const limit = Math.max(1, Math.min(take, 30));

  const [follows, blocked, blockedBy] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }),
    prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    }),
    prisma.block.findMany({
      where: { blockedId: userId },
      select: { blockerId: true },
    }),
  ]);

  const excludedIds = new Set<string>([
    ...blocked.map((block) => block.blockedId),
    ...blockedBy.map((block) => block.blockerId),
  ]);

  const followingIds = follows
    .map((follow) => follow.followingId)
    .filter((id) => !excludedIds.has(id));

  if (followingIds.length === 0) {
    return { submissions: [], hasMore: false };
  }

  const submissions = await prisma.submission.findMany({
    where: {
      userId: { in: followingIds },
      shareStatus: "PUBLIC",
      OR: [{ imageUrl: { not: null } }, { text: { not: null } }],
    },
    orderBy: { createdAt: "desc" },
    include: submissionInclude,
    skip,
    take: limit + 1,
  });

  const hasMore = submissions.length > limit;
  const sliced = submissions.slice(0, limit);

  const normalized: ExhibitionSubmission[] = sliced.map((s) => ({
    id: s.id,
    title: s.title,
    imageUrl: s.imageUrl,
    imageFocalPoint: normalizeFocalPoint(s.imageFocalPoint),
    text: s.text,
    tags: s.tags,
    category: s.category,
    wordIndex: s.wordIndex,
    createdAt: s.createdAt,
    shareStatus: s.shareStatus,
    critiquesEnabled: s.critiquesEnabled,
    user: {
      id: s.user.id,
      name: s.user.name,
      image: s.user.image,
    },
    prompt: s.prompt,
  }));

  return {
    submissions: normalized,
    hasMore,
  };
}
