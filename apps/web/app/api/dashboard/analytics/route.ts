import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const WINDOW_DAYS = 30;
const TAG_DISTRIBUTION_LIMIT = 22;

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

function addUtcDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function utcDayKey(d: Date): string {
  return startOfUtcDay(d).toISOString().slice(0, 10);
}

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const todayUtc = startOfUtcDay(new Date());
  const windowStart = addUtcDays(todayUtc, -(WINDOW_DAYS - 1));
  const previousWindowStart = addUtcDays(windowStart, -WINDOW_DAYS);

  const [recentSubmissions, portfolioRows, previousWindowCount] =
    await Promise.all([
      prisma.submission.findMany({
        where: {
          userId,
          createdAt: { gte: windowStart },
        },
        select: { createdAt: true, isPortfolio: true },
      }),
      prisma.submission.findMany({
        where: { userId, isPortfolio: true },
        select: { category: true, tags: true },
      }),
      prisma.submission.count({
        where: {
          userId,
          createdAt: {
            gte: previousWindowStart,
            lt: windowStart,
          },
        },
      }),
    ]);

  const dayKeys: string[] = [];
  for (let i = 0; i < WINDOW_DAYS; i++) {
    dayKeys.push(utcDayKey(addUtcDays(windowStart, i)));
  }

  const portfolioByDay = new Map<string, number>();
  const otherByDay = new Map<string, number>();
  for (const key of dayKeys) {
    portfolioByDay.set(key, 0);
    otherByDay.set(key, 0);
  }
  for (const row of recentSubmissions) {
    const key = utcDayKey(row.createdAt);
    if (!portfolioByDay.has(key)) {
      continue;
    }
    if (row.isPortfolio) {
      portfolioByDay.set(key, (portfolioByDay.get(key) ?? 0) + 1);
    } else {
      otherByDay.set(key, (otherByDay.get(key) ?? 0) + 1);
    }
  }

  const submissionsByDay = dayKeys.map((dateKey) => ({
    dateKey,
    portfolioCount: portfolioByDay.get(dateKey) ?? 0,
    otherCount: otherByDay.get(dateKey) ?? 0,
  }));

  const currentWindowCount = recentSubmissions.length;
  let momentumPercent: number | null = null;
  if (previousWindowCount > 0) {
    momentumPercent = Math.round(
      ((currentWindowCount - previousWindowCount) / previousWindowCount) * 100,
    );
  } else if (currentWindowCount > 0) {
    momentumPercent = null;
  }

  const categoryCount = new Map<string, number>();
  for (const row of portfolioRows) {
    const label = row.category?.trim() || "";
    const key = label.length > 0 ? label : "__uncategorized__";
    categoryCount.set(key, (categoryCount.get(key) ?? 0) + 1);
  }

  const categoryDistribution = [...categoryCount.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const portfolioItemCount = portfolioRows.length;
  const tagCount = new Map<string, number>();
  for (const row of portfolioRows) {
    const seen = new Set<string>();
    for (const raw of row.tags) {
      const tag = raw.trim();
      if (tag.length === 0 || seen.has(tag)) {
        continue;
      }
      seen.add(tag);
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
    }
  }

  const tagSorted = [...tagCount.entries()].sort((a, b) => b[1] - a[1]);
  const distinctTagCount = tagSorted.length;
  const tagDistributionTruncated = distinctTagCount > TAG_DISTRIBUTION_LIMIT;
  const tagDistribution = tagSorted
    .slice(0, TAG_DISTRIBUTION_LIMIT)
    .map(([name, count]) => ({ name, count }));

  return NextResponse.json({
    submissionsByDay,
    categoryDistribution,
    tagDistribution,
    tagDistributionTruncated,
    tagDistributionLimit: TAG_DISTRIBUTION_LIMIT,
    portfolioItemCount,
    momentumPercent,
    previousWindowSubmissionCount: previousWindowCount,
    currentWindowSubmissionCount: currentWindowCount,
  });
}
