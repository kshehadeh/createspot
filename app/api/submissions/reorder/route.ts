import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { submissionIds } = body;

  if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
    return NextResponse.json(
      { error: "submissionIds must be a non-empty array" },
      { status: 400 }
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

  if (submissions.length !== submissionIds.length) {
    return NextResponse.json(
      { error: "Some submissions not found or not owned by user" },
      { status: 400 }
    );
  }

  // Update portfolio order for each submission
  // Order is 1-indexed (1 = first, 2 = second, etc.)
  const updates = submissionIds.map((id: string, index: number) =>
    prisma.submission.update({
      where: { id },
      data: { portfolioOrder: index + 1 },
    })
  );

  await prisma.$transaction(updates);

  return NextResponse.json({ success: true });
}



