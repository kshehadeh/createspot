import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function deleteImageFromR2(imageUrl: string): Promise<void> {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl || !imageUrl.startsWith(publicUrl)) return;

  const key = imageUrl.replace(`${publicUrl}/`, "");
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      }),
    );
  } catch (error) {
    console.error("Failed to delete progression image from R2:", error);
  }
}

interface RouteParams {
  params: Promise<{ id: string; progressionId: string }>;
}

/**
 * PUT /api/submissions/[id]/progressions/[progressionId]
 * Update a progression.
 * Body: { imageUrl?: string, text?: string, comment?: string, order?: number }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: submissionId, progressionId } = await params;

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

  // Verify the progression exists and belongs to this submission
  const existingProgression = await prisma.progression.findUnique({
    where: { id: progressionId },
  });

  if (!existingProgression) {
    return NextResponse.json(
      { error: "Progression not found" },
      { status: 404 },
    );
  }

  if (existingProgression.submissionId !== submissionId) {
    return NextResponse.json(
      { error: "Progression does not belong to this submission" },
      { status: 400 },
    );
  }

  const body = await request.json();
  const { imageUrl, text, comment, order } = body;

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (imageUrl !== undefined) {
    // Delete old image from R2 if being replaced
    if (
      existingProgression.imageUrl &&
      existingProgression.imageUrl !== imageUrl
    ) {
      await deleteImageFromR2(existingProgression.imageUrl);
    }
    updateData.imageUrl = imageUrl;
  }
  if (text !== undefined) updateData.text = text;
  if (comment !== undefined) updateData.comment = comment;
  if (order !== undefined) updateData.order = order;

  // Validate: after update, must still have at least imageUrl or text
  const finalImageUrl =
    imageUrl !== undefined ? imageUrl : existingProgression.imageUrl;
  const finalText = text !== undefined ? text : existingProgression.text;
  if (!finalImageUrl && !finalText) {
    return NextResponse.json(
      { error: "Progression must have at least imageUrl or text" },
      { status: 400 },
    );
  }

  const progression = await prisma.progression.update({
    where: { id: progressionId },
    data: updateData,
  });

  return NextResponse.json({ progression });
}

/**
 * DELETE /api/submissions/[id]/progressions/[progressionId]
 * Delete a progression.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: submissionId, progressionId } = await params;

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

  // Verify the progression exists and belongs to this submission
  const progression = await prisma.progression.findUnique({
    where: { id: progressionId },
  });

  if (!progression) {
    return NextResponse.json(
      { error: "Progression not found" },
      { status: 404 },
    );
  }

  if (progression.submissionId !== submissionId) {
    return NextResponse.json(
      { error: "Progression does not belong to this submission" },
      { status: 400 },
    );
  }

  // Delete image from R2 if it exists
  if (progression.imageUrl) {
    await deleteImageFromR2(progression.imageUrl);
  }

  // Delete the progression
  await prisma.progression.delete({
    where: { id: progressionId },
  });

  return NextResponse.json({ success: true });
}
