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
  return getPrisma().user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
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
  const p = getPrisma();
  // 1s buffer for clock skew between test runner and DB
  const sinceWithBuffer = new Date(since.getTime() - 1000);
  const submissionWhere = {
    userId,
    createdAt: { gte: sinceWithBuffer },
  } as const;

  await p.critique.deleteMany({
    where: { critiquerId: userId, createdAt: { gte: sinceWithBuffer } },
  });
  await p.critique.deleteMany({
    where: { submission: submissionWhere },
  });

  await p.favorite.deleteMany({
    where: { userId, createdAt: { gte: sinceWithBuffer } },
  });

  await p.collectionSubmission.deleteMany({
    where: { collection: { userId, createdAt: { gte: sinceWithBuffer } } },
  });
  await p.collectionSubmission.deleteMany({
    where: { submission: submissionWhere },
  });

  await p.collection.deleteMany({
    where: { userId, createdAt: { gte: sinceWithBuffer } },
  });

  await p.submissionView.deleteMany({
    where: { submission: submissionWhere },
  });

  await p.progression.deleteMany({
    where: { submission: submissionWhere },
  });

  await p.shortLink.deleteMany({
    where: { submission: submissionWhere },
  });

  await p.submission.deleteMany({
    where: { userId, createdAt: { gte: sinceWithBuffer } },
  });

  await p.prompt.deleteMany({
    where: { createdByUserId: userId, createdAt: { gte: sinceWithBuffer } },
  });
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}
