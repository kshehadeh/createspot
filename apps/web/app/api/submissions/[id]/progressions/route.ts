import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/submissions/[id]/progressions
 * Fetch all progressions for a submission, ordered by their order field.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: submissionId } = await params;

  // First, check if the submission exists and get its share status
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      userId: true,
      shareStatus: true,
    },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  // Check visibility - PRIVATE submissions only visible to owner
  const session = await auth();
  if (submission.shareStatus === "PRIVATE") {
    if (!session?.user || session.user.id !== submission.userId) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }
  }

  // Fetch progressions ordered by order field
  const progressions = await prisma.progression.findMany({
    where: { submissionId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ progressions });
}

/**
 * POST /api/submissions/[id]/progressions
 * Create a new progression for a submission.
 * Body: { imageUrl?: string, text?: string, comment?: string }
 * At least imageUrl or text must be provided.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: submissionId } = await params;

  // Verify the submission exists and user owns it
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { userId: true },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  if (submission.userId !== session.user.id) {
    return NextResponse.json(
      { error: "You do not own this submission" },
      { status: 403 },
    );
  }

  const body = await request.json();
  const { imageUrl, text, comment } = body;

  // Validate: must have at least imageUrl or text
  if (!imageUrl && !text) {
    return NextResponse.json(
      { error: "At least imageUrl or text must be provided" },
      { status: 400 },
    );
  }

  // Get the current max order for this submission
  const maxOrderResult = await prisma.progression.aggregate({
    where: { submissionId },
    _max: { order: true },
  });
  const nextOrder = (maxOrderResult._max.order ?? -1) + 1;

  // Create the progression
  const progression = await prisma.progression.create({
    data: {
      submissionId,
      imageUrl: imageUrl || null,
      text: text || null,
      comment: comment || null,
      order: nextOrder,
    },
  });

  return NextResponse.json({ progression }, { status: 201 });
}
