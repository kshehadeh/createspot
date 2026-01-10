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

  // Update order for each submission
  // Order is 1-indexed (1 = first, 2 = second, etc.)
  const updates = submissionIds.map((submissionId: string, index: number) =>
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

  await prisma.$transaction(updates);

  return NextResponse.json({ success: true });
}
