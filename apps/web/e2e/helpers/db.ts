import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../../app/generated/prisma/client";

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

export async function getTestUser() {
  const email = process.env.E2E_USER_EMAIL;
  if (!email) {
    throw new Error("E2E_USER_EMAIL is not set");
  }
  return prisma.user.findUnique({ where: { email } });
}

export async function getCurrentPrompt() {
  const now = new Date();
  return prisma.prompt.findFirst({
    where: {
      weekStart: { lte: now },
      weekEnd: { gte: now },
    },
  });
}

export async function createTestPrompt(userId: string) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return prisma.prompt.create({
    data: {
      word1: "test",
      word2: "e2e",
      word3: "run",
      weekStart,
      weekEnd,
      createdByUserId: userId,
    },
  });
}

export async function cleanupTestData(userId: string, since: Date) {
  await prisma.critique.deleteMany({
    where: { critiquerId: userId, createdAt: { gte: since } },
  });

  await prisma.favorite.deleteMany({
    where: { userId, createdAt: { gte: since } },
  });

  await prisma.collectionSubmission.deleteMany({
    where: { collection: { userId, createdAt: { gte: since } } },
  });

  await prisma.collection.deleteMany({
    where: { userId, createdAt: { gte: since } },
  });

  await prisma.progression.deleteMany({
    where: { submission: { userId, createdAt: { gte: since } } },
  });

  await prisma.submission.deleteMany({
    where: { userId, createdAt: { gte: since } },
  });

  await prisma.prompt.deleteMany({
    where: { createdByUserId: userId, createdAt: { gte: since } },
  });
}

export { prisma };
