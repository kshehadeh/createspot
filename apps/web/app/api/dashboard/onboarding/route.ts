import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface OnboardingStatus {
  hasFavorited: boolean;
  hasSubmission: boolean;
  hasCritique: boolean;
  hasFollowing: boolean;
  hasCollection: boolean;
  dismissed: boolean;
}

export async function GET(): Promise<
  NextResponse<OnboardingStatus | { error: string }>
> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Run all checks in parallel for efficiency
  const [
    favoritesCount,
    submissionsCount,
    critiquesGivenCount,
    critiquesReceivedCount,
    followingCount,
    collectionsCount,
    user,
  ] = await Promise.all([
    prisma.favorite.count({ where: { userId } }),
    prisma.submission.count({ where: { userId } }),
    prisma.critique.count({ where: { critiquerId: userId } }),
    prisma.critique.count({
      where: { submission: { userId } },
    }),
    prisma.follow.count({ where: { followerId: userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingDismissedAt: true },
    }),
  ]);

  const hasCritique = critiquesGivenCount > 0 || critiquesReceivedCount > 0;

  return NextResponse.json({
    hasFavorited: favoritesCount > 0,
    hasSubmission: submissionsCount > 0,
    hasCritique,
    hasFollowing: followingCount > 0,
    hasCollection: collectionsCount > 0,
    dismissed: !!user?.onboardingDismissedAt,
  });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  if (body.action === "dismiss") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingDismissedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
