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

export async function getPromptSubmissions(promptId: string, limit?: number) {
  return prisma.submission.findMany({
    where: {
      promptId,
      shareStatus: "PUBLIC", // Only show public submissions in galleries
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
      _count: {
        select: { favorites: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
