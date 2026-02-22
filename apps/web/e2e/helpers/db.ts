import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../../app/generated/prisma/client";

let prisma: PrismaClient | undefined;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getPrisma() {
  prisma ??= createPrismaClient();
  return prisma;
}

export async function getTestUser() {
  const email = process.env.E2E_USER_EMAIL;
  if (!email) {
    throw new Error("E2E_USER_EMAIL is not set");
  }
  return getPrisma().user.findUnique({ where: { email: email.trim().toLowerCase() } });
}

export async function getCurrentPrompt() {
  const now = new Date();
  return getPrisma().prompt.findFirst({
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

  return getPrisma().prompt.create({
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
  await getPrisma().critique.deleteMany({
    where: { critiquerId: userId, createdAt: { gte: since } },
  });

  await getPrisma().favorite.deleteMany({
    where: { userId, createdAt: { gte: since } },
  });

  await getPrisma().collectionSubmission.deleteMany({
    where: { collection: { userId, createdAt: { gte: since } } },
  });

  await getPrisma().collection.deleteMany({
    where: { userId, createdAt: { gte: since } },
  });

  await getPrisma().progression.deleteMany({
    where: { submission: { userId, createdAt: { gte: since } } },
  });

  await getPrisma().submission.deleteMany({
    where: { userId, createdAt: { gte: since } },
  });

  await getPrisma().prompt.deleteMany({
    where: { createdByUserId: userId, createdAt: { gte: since } },
  });
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}
