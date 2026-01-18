import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";
  const userId = searchParams.get("userId");

  // Users can only search their own tags
  if (userId && userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetUserId = userId || session.user.id;

  // Build where clause
  const where: Prisma.SubmissionWhereInput = {
    userId: targetUserId,
    isPortfolio: true,
    tags: { isEmpty: false },
  };

  // Fetch portfolio items with tags
  const portfolioItems = await prisma.submission.findMany({
    where,
    select: { tags: true },
  });

  // Count tag usage across all portfolio items
  const tagCounts: Record<string, number> = {};
  portfolioItems.forEach((item) => {
    item.tags.forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Extract unique tags
  let allTags = Object.keys(tagCounts);

  // Filter by query if provided
  if (query) {
    const queryLower = query.toLowerCase();
    allTags = allTags.filter((tag) => tag.toLowerCase().includes(queryLower));
  }

  // Sort by usage count (descending), then alphabetically
  allTags.sort((a, b) => {
    const countDiff = tagCounts[b] - tagCounts[a];
    if (countDiff !== 0) return countDiff;
    return a.localeCompare(b);
  });

  // Limit to 50 results
  const tags = allTags.slice(0, 50);

  // If no query, also return top 5 most used tags
  const topUsedTags = query
    ? []
    : Object.entries(tagCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 5)
        .map(([tag]) => tag);

  return NextResponse.json({ tags, topUsedTags });
}
