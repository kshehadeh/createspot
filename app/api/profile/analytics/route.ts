import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId") || session.user.id;

  // Only allow users to view their own analytics
  if (userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all analytics counts in parallel
  const [
    uniqueVisitors,
    totalFavorites,
    totalViews,
    submissionCount,
    portfolioCount,
    totalWorkCount,
  ] = await Promise.all([
    // Get unique visitors count
    prisma.profileView.count({
      where: { profileUserId: userId },
    }),
    // Get total favorites on all user's submissions
    prisma.favorite.count({
      where: {
        submission: {
          userId: userId,
        },
      },
    }),
    // Get total views on all user's submissions
    prisma.submissionView.count({
      where: {
        submission: {
          userId: userId,
        },
      },
    }),
    // Get submission count (prompt submissions only)
    prisma.submission.count({
      where: {
        userId: userId,
        promptId: { not: null },
      },
    }),
    // Get portfolio count (items marked as portfolio)
    prisma.submission.count({
      where: {
        userId: userId,
        isPortfolio: true,
      },
    }),
    // Get total work count (all submissions)
    prisma.submission.count({
      where: { userId: userId },
    }),
  ]);

  return NextResponse.json({
    analytics: {
      uniqueVisitors,
      totalFavorites,
      totalViews,
      submissionCount,
      portfolioCount,
      totalWorkCount,
    },
  });
}
