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

  if (!Array.isArray(submissionIds)) {
    return NextResponse.json(
      { error: "submissionIds array is required" },
      { status: 400 },
    );
  }

  // Update order for each submission
  await prisma.$transaction(
    submissionIds.map((submissionId, index) =>
      prisma.collectionSubmission.updateMany({
        where: {
          collectionId: id,
          submissionId,
        },
        data: { order: index },
      }),
    ),
  );

  return NextResponse.json({ success: true });
}
