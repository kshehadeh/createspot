import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() || "";
  const exhibitId = searchParams.get("exhibitId");

  // Build base where clause for exhibition submissions
  const baseWhere: Prisma.SubmissionWhereInput = {
    shareStatus: "PUBLIC",
  };

  // If exhibitId is provided, filter to only submissions in that exhibit
  if (exhibitId) {
    baseWhere.exhibitSubmissions = {
      some: {
        exhibitId,
      },
    };
  } else {
    // For permanent collection (no exhibitId), only show portfolio items
    baseWhere.isPortfolio = true;
  }

  // Fetch submissions with tags
  const submissions = await prisma.submission.findMany({
    where: { ...baseWhere, tags: { isEmpty: false } },
    select: { tags: true },
  });

  // Count tag usage across all submissions
  const tagCounts: Record<string, number> = {};
  submissions.forEach((submission) => {
    submission.tags.forEach((tag) => {
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
