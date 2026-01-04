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

  // Get unique visitors count
  const uniqueVisitors = await prisma.profileView.count({
    where: { profileUserId: userId },
  });

  // Get total favorites on all user's submissions
  const totalFavorites = await prisma.favorite.count({
    where: {
      submission: {
        userId: userId,
      },
    },
  });

  // Get total views on all user's submissions
  const totalViews = await prisma.submissionView.count({
    where: {
      submission: {
        userId: userId,
      },
    },
  });

  // Get submission count (prompt submissions only)
  const submissionCount = await prisma.submission.count({
    where: {
      userId: userId,
      promptId: { not: null },
    },
  });

  // Get portfolio count (items marked as portfolio)
  const portfolioCount = await prisma.submission.count({
    where: {
      userId: userId,
      isPortfolio: true,
    },
  });

  // Get total work count (all submissions)
  const totalWorkCount = await prisma.submission.count({
    where: { userId: userId },
  });

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

