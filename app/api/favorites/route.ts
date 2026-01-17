import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendFavoriteNotification } from "@/app/workflows/send-favorite-notification";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const submissionIds = searchParams.get("submissionIds");

  if (submissionIds) {
    const ids = submissionIds.split(",");
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: session.user.id,
        submissionId: { in: ids },
      },
      select: { submissionId: true },
    });
    return NextResponse.json({
      favoriteIds: favorites.map((f) => f.submissionId),
    });
  }

  const favorites = await prisma.favorite.findMany({
    where: {
      userId: session.user.id,
      // Only include favorites where submission is visible to the user
      // PRIVATE: Only if the user owns the submission
      // PROFILE/PUBLIC: Always visible
      submission: {
        OR: [
          { shareStatus: "PUBLIC" },
          { shareStatus: "PROFILE" },
          { userId: session.user.id }, // User can see their own PRIVATE submissions
        ],
      },
    },
    include: {
      submission: {
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          prompt: {
            select: { word1: true, word2: true, word3: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ favorites });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { submissionId } = body;

  if (!submissionId) {
    return NextResponse.json(
      { error: "Submission ID is required" },
      { status: 400 },
    );
  }

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  const favorite = await prisma.favorite.create({
    data: {
      userId: session.user.id,
      submissionId,
    },
  });

  console.log("[API] Favorite created:", {
    favorerId: session.user.id,
    submissionId,
  });

  // Trigger workflow asynchronously without awaiting
  console.log("[API] Triggering sendFavoriteNotification workflow...");
  sendFavoriteNotification({
    favorerId: session.user.id,
    submissionId,
  })
    .then((result) => {
      console.log("[API] Workflow result:", result);
    })
    .catch((error) => {
      console.error(
        "[API] Failed to trigger favorite notification workflow:",
        error,
      );
    });

  return NextResponse.json({ favorite });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const submissionId = searchParams.get("submissionId");

  if (!submissionId) {
    return NextResponse.json(
      { error: "Submission ID is required" },
      { status: 400 },
    );
  }

  await prisma.favorite.deleteMany({
    where: {
      userId: session.user.id,
      submissionId,
    },
  });

  return NextResponse.json({ success: true });
}
