import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  }

  if (collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { submissionIds } = body;

  if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
    return NextResponse.json(
      { error: "submissionIds array is required" },
      { status: 400 },
    );
  }

  // Verify all submissions belong to the user and are portfolio items
  const submissions = await prisma.submission.findMany({
    where: {
      id: { in: submissionIds },
      userId: session.user.id,
      isPortfolio: true,
    },
    select: { id: true },
  });

  const validSubmissionIds = submissions.map((s) => s.id);

  if (validSubmissionIds.length === 0) {
    return NextResponse.json(
      { error: "No valid submissions found" },
      { status: 400 },
    );
  }

  // Get current max order
  const maxOrderResult = await prisma.collectionSubmission.aggregate({
    where: { collectionId: id },
    _max: { order: true },
  });

  let nextOrder = (maxOrderResult._max.order ?? -1) + 1;

  // Add submissions that aren't already in the collection
  const existingSubmissions = await prisma.collectionSubmission.findMany({
    where: {
      collectionId: id,
      submissionId: { in: validSubmissionIds },
    },
    select: { submissionId: true },
  });

  const existingIds = new Set(existingSubmissions.map((s) => s.submissionId));
  const newSubmissionIds = validSubmissionIds.filter(
    (id) => !existingIds.has(id),
  );

  if (newSubmissionIds.length > 0) {
    await prisma.collectionSubmission.createMany({
      data: newSubmissionIds.map((submissionId) => ({
        collectionId: id,
        submissionId,
        order: nextOrder++,
      })),
    });
  }

  return NextResponse.json({
    added: newSubmissionIds.length,
    skipped: validSubmissionIds.length - newSubmissionIds.length,
  });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const collection = await prisma.collection.findUnique({
    where: { id },
  });

  if (!collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404 },
    );
  }

  if (collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { submissionIds } = body;

  if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
    return NextResponse.json(
      { error: "submissionIds array is required" },
      { status: 400 },
    );
  }

  const result = await prisma.collectionSubmission.deleteMany({
    where: {
      collectionId: id,
      submissionId: { in: submissionIds },
    },
  });

  return NextResponse.json({ removed: result.count });
}
