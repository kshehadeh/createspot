import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: exhibitId } = await params;
  const body = await request.json();
  const { submissionId } = body;

  // Verify exhibit exists
  const exhibit = await prisma.exhibit.findUnique({
    where: { id: exhibitId },
  });

  if (!exhibit) {
    return NextResponse.json({ error: "Exhibit not found" }, { status: 404 });
  }

  // If submissionId is null, clear the featured submission
  if (submissionId === null || submissionId === "") {
    await prisma.exhibit.update({
      where: { id: exhibitId },
      data: { featuredSubmissionId: null },
    });

    return NextResponse.json({ success: true });
  }

  // Verify submission exists and is in the exhibit
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

  await prisma.exhibit.update({
    where: { id: exhibitId },
    data: { featuredSubmissionId: submissionId },
  });

  return NextResponse.json({ success: true });
}
