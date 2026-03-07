import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "./prisma";

export async function getCurrentPrompt() {
  "use cache";
  cacheLife("hours");
  cacheTag("current-prompt");

  const now = new Date();
  return prisma.prompt.findFirst({
    where: {
      weekStart: { lte: now },
      weekEnd: { gte: now },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPromptSubmissions(
  promptId: string,
  skip: number = 0,
  take: number = 50,
) {
  "use cache";
  cacheLife("minutes");
  cacheTag("prompt-submissions");

  const submissions = await prisma.submission.findMany({
    where: {
      promptId,
      shareStatus: "PUBLIC", // Only show public submissions in galleries
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
      prompt: {
        select: { word1: true, word2: true, word3: true },
      },
      _count: {
        select: { favorites: true },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: take + 1, // Fetch one extra to check if there are more
  });

  const hasMore = submissions.length > take;

  return {
    submissions: submissions.slice(0, take),
    hasMore,
  };
}
