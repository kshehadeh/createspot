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

  // Verify all submissions belong to this exhibit
  const exhibitSubmissions = await prisma.exhibitSubmission.findMany({
    where: {
      exhibitId,
      submissionId: { in: submissionIds },
    },
  });

  if (exhibitSubmissions.length !== submissionIds.length) {
    return NextResponse.json(
      { error: "Some submissions not found in exhibit" },
      { status: 400 },
    );
  }

  // Get all other submissions in the exhibit that aren't being reordered
  const allExhibitSubmissions = await prisma.exhibitSubmission.findMany({
    where: { exhibitId },
    select: { submissionId: true },
  });

  const reorderedSet = new Set(submissionIds);
  const otherSubmissionIds = allExhibitSubmissions
    .map((es) => es.submissionId)
    .filter((id) => !reorderedSet.has(id));

  // Update order for reordered submissions (1-indexed)
  const reorderUpdates = submissionIds.map(
    (submissionId: string, index: number) =>
      prisma.exhibitSubmission.update({
        where: {
          exhibitId_submissionId: {
            exhibitId,
            submissionId,
          },
        },
        data: { order: index + 1 },
      }),
  );

  // Update order for other submissions (place them after the reordered ones)
  const otherUpdates = otherSubmissionIds.map(
    (submissionId: string, index: number) =>
      prisma.exhibitSubmission.update({
        where: {
          exhibitId_submissionId: {
            exhibitId,
            submissionId,
          },
        },
        data: { order: submissionIds.length + index + 1 },
      }),
  );

  await prisma.$transaction([...reorderUpdates, ...otherUpdates], {
    isolationLevel: "ReadCommitted",
  });

  return NextResponse.json({ success: true });
}
