import { prisma } from "./prisma";

export async function getCurrentPrompt() {
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
  options?: { skip?: number; take?: number },
) {
  const skip = options?.skip ?? 0;
  const take = options?.take ?? 50;

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
