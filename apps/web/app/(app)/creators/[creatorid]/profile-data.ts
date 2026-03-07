import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";

const MAX_PROMPT_GROUPS = 6;
const INITIAL_PROMPT_GROUPS = 5;

interface ProfileDataParams {
  creatorid: string;
  includePrivate: boolean;
}

export async function getProfileMetadataUser(creatorid: string) {
  "use cache";
  cacheLife("days");
  cacheTag("creator", `creator-${creatorid}`);

  return prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: {
      id: true,
      name: true,
      bio: true,
      slug: true,
    },
  });
}

async function getProfileData({
  creatorid,
  includePrivate,
}: ProfileDataParams) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ slug: creatorid }, { id: creatorid }],
    },
    select: {
      id: true,
      name: true,
      image: true,
      profileImageUrl: true,
      profileImageFocalPoint: true,
      bio: true,
      instagram: true,
      twitter: true,
      linkedin: true,
      website: true,
      featuredSubmissionId: true,
      slug: true,
      badgeAwards: {
        select: {
          badgeKey: true,
          awardedAt: true,
        },
        orderBy: { awardedAt: "desc" },
      },
    },
  });

  if (!user) return null;

  const shareStatusFilter = includePrivate
    ? {}
    : { shareStatus: { in: ["PROFILE" as const, "PUBLIC" as const] } };

  const [portfolioItemsRaw, prompts, submissionCount, featuredSubmissionRaw] =
    await Promise.all([
      prisma.submission.findMany({
        where: {
          userId: user.id,
          isPortfolio: true,
          ...shareStatusFilter,
        },
        orderBy: [{ portfolioOrder: "asc" }, { createdAt: "desc" }],
        include: {
          prompt: {
            select: {
              word1: true,
              word2: true,
              word3: true,
            },
          },
          _count: {
            select: { favorites: true },
          },
          progressions: {
            orderBy: { order: "desc" },
            take: 1,
            select: {
              imageUrl: true,
              text: true,
            },
          },
        },
      }),
      prisma.prompt.findMany({
        where: {
          submissions: {
            some: {
              userId: user.id,
              ...shareStatusFilter,
            },
          },
        },
        orderBy: { weekStart: "desc" },
        take: MAX_PROMPT_GROUPS,
        include: {
          submissions: {
            where: {
              userId: user.id,
              ...shareStatusFilter,
            },
            orderBy: { wordIndex: "asc" },
          },
        },
      }),
      prisma.submission.count({
        where: {
          userId: user.id,
          ...(includePrivate
            ? {}
            : {
                shareStatus: { in: ["PROFILE" as const, "PUBLIC" as const] },
              }),
        },
      }),
      user.featuredSubmissionId
        ? prisma.submission.findUnique({
            where: { id: user.featuredSubmissionId },
            include: {
              prompt: {
                select: {
                  word1: true,
                  word2: true,
                  word3: true,
                },
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
              _count: {
                select: {
                  favorites: true,
                },
              },
            },
          })
        : null,
    ]);

  const portfolioItems = portfolioItemsRaw.map((item) => {
    const latest = item.progressions?.[0];
    return {
      ...item,
      latestProgressionImageUrl: latest?.imageUrl ?? null,
      latestProgressionText: latest?.text ?? null,
      progressions: undefined,
    };
  });

  const featuredSubmission =
    featuredSubmissionRaw &&
    (includePrivate ||
      featuredSubmissionRaw.shareStatus === "PROFILE" ||
      featuredSubmissionRaw.shareStatus === "PUBLIC")
      ? featuredSubmissionRaw
      : null;

  const allPortfolioItems = [...portfolioItems];
  if (
    featuredSubmission &&
    !portfolioItems.some((item) => item.id === featuredSubmission.id)
  ) {
    allPortfolioItems.unshift({
      id: featuredSubmission.id,
      title: featuredSubmission.title,
      imageUrl: featuredSubmission.imageUrl,
      imageFocalPoint: featuredSubmission.imageFocalPoint as {
        x: number;
        y: number;
      } | null,
      text: featuredSubmission.text,
      isPortfolio: featuredSubmission.isPortfolio,
      portfolioOrder: featuredSubmission.portfolioOrder,
      tags: featuredSubmission.tags,
      category: featuredSubmission.category,
      promptId: featuredSubmission.promptId,
      wordIndex: featuredSubmission.wordIndex,
      prompt: featuredSubmission.prompt,
      _count: featuredSubmission._count,
    } as (typeof portfolioItems)[0]);
  }

  const hasMore = prompts.length > INITIAL_PROMPT_GROUPS;
  const initialItems = hasMore
    ? prompts.slice(0, INITIAL_PROMPT_GROUPS)
    : prompts;

  return {
    user,
    portfolioItems,
    allPortfolioItems,
    initialItems,
    hasMore,
    submissionCount,
    featuredSubmission,
    hasSocialLinks:
      Boolean(user.instagram) ||
      Boolean(user.twitter) ||
      Boolean(user.linkedin) ||
      Boolean(user.website),
  };
}

export async function getCachedPublicProfileData(creatorid: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("creator", `creator-${creatorid}`);

  return getProfileData({ creatorid, includePrivate: false });
}

export async function getDynamicOwnerProfileData(creatorid: string) {
  return getProfileData({ creatorid, includePrivate: true });
}
