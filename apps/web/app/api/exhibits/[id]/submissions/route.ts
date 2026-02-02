import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: exhibitId } = await params;
  const body = await request.json();
  const { submissionIds } = body;

  if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
    return NextResponse.json(
      { error: "submissionIds must be a non-empty array" },
      { status: 400 },
    );
  }

  // Verify exhibit exists
  const exhibit = await prisma.exhibit.findUnique({
    where: { id: exhibitId },
  });

  if (!exhibit) {
    return NextResponse.json({ error: "Exhibit not found" }, { status: 404 });
  }

  // Verify all submissions exist and are public
  const submissions = await prisma.submission.findMany({
    where: {
      id: { in: submissionIds },
      shareStatus: "PUBLIC",
    },
    select: { id: true },
  });

  if (submissions.length !== submissionIds.length) {
    return NextResponse.json(
      { error: "Some submissions not found or not public" },
      { status: 400 },
    );
  }

  // Get current max order for this exhibit
  const maxOrder = await prisma.exhibitSubmission.findFirst({
    where: { exhibitId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  let nextOrder = (maxOrder?.order ?? 0) + 1;

  // Create exhibit submissions, skipping duplicates
  const existing = await prisma.exhibitSubmission.findMany({
    where: {
      exhibitId,
      submissionId: { in: submissionIds },
    },
    select: { submissionId: true },
  });

  const existingIds = new Set(existing.map((es) => es.submissionId));
  const newSubmissionIds = submissionIds.filter(
    (id: string) => !existingIds.has(id),
  );

  if (newSubmissionIds.length === 0) {
    return NextResponse.json({
      message: "All submissions already in exhibit",
      added: 0,
    });
  }

  const createOperations = newSubmissionIds.map((submissionId: string) =>
    prisma.exhibitSubmission.create({
      data: {
        exhibitId,
        submissionId,
        order: nextOrder++,
      },
    }),
  );

  await prisma.$transaction(createOperations);

  return NextResponse.json({
    success: true,
    added: newSubmissionIds.length,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: exhibitId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const submissionId = searchParams.get("submissionId");

  if (!submissionId) {
    return NextResponse.json(
      { error: "submissionId is required" },
      { status: 400 },
    );
  }

  // Verify exhibit submission exists
  const exhibitSubmission = await prisma.exhibitSubmission.findUnique({
    where: {
      exhibitId_submissionId: {
        exhibitId,
        submissionId,
      },
    },
  });

  if (!exhibitSubmission) {
    return NextResponse.json(
      { error: "Submission not found in exhibit" },
      { status: 404 },
    );
  }

  await prisma.exhibitSubmission.delete({
    where: {
      exhibitId_submissionId: {
        exhibitId,
        submissionId,
      },
    },
  });

  return NextResponse.json({ success: true });
}
