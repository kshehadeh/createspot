import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface ReorderItem {
  id: string;
  order: number;
}

/**
 * PUT /api/submissions/[id]/progressions/reorder
 * Bulk reorder progressions.
 * Body: { items: Array<{ id: string, order: number }> }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
  const { items } = body as { items: ReorderItem[] };

  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: "items must be an array of { id, order }" },
      { status: 400 },
    );
  }

  // Validate that all items have required fields
  for (const item of items) {
    if (typeof item.id !== "string" || typeof item.order !== "number") {
      return NextResponse.json(
        { error: "Each item must have id (string) and order (number)" },
        { status: 400 },
      );
    }
  }

  // Verify all progressions belong to this submission
  const progressionIds = items.map((item) => item.id);
  const existingProgressions = await prisma.progression.findMany({
    where: {
      id: { in: progressionIds },
    },
    select: {
      id: true,
      submissionId: true,
    },
  });

  // Check that all progressions exist and belong to this submission
  const existingIds = new Set(existingProgressions.map((p) => p.id));
  for (const item of items) {
    if (!existingIds.has(item.id)) {
      return NextResponse.json(
        { error: `Progression not found: ${item.id}` },
        { status: 404 },
      );
    }
  }

  for (const progression of existingProgressions) {
    if (progression.submissionId !== submissionId) {
      return NextResponse.json(
        {
          error: `Progression ${progression.id} does not belong to this submission`,
        },
        { status: 400 },
      );
    }
  }

  // Update all progressions in a transaction
  await prisma.$transaction(
    items.map((item) =>
      prisma.progression.update({
        where: { id: item.id },
        data: { order: item.order },
      }),
    ),
  );

  // Fetch and return the updated progressions
  const progressions = await prisma.progression.findMany({
    where: { submissionId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ progressions });
}
