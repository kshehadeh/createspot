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
    console.error("Failed to delete image from R2:", error);
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const promptId = searchParams.get("promptId");

  if (!promptId) {
    return NextResponse.json(
      { error: "Prompt ID is required" },
      { status: 400 },
    );
  }

  const submissions = await prisma.submission.findMany({
    where: {
      userId: session.user.id,
      promptId,
    },
  });

  return NextResponse.json({ submissions });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { promptId, wordIndex, title, imageUrl, text } = body;

  if (!promptId || !wordIndex || wordIndex < 1 || wordIndex > 3) {
    return NextResponse.json(
      { error: "Invalid prompt ID or word index" },
      { status: 400 },
    );
  }

  // Check if prompt exists and is active
  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
  });

  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const now = new Date();
  if (now < prompt.weekStart || now > prompt.weekEnd) {
    return NextResponse.json(
      { error: "This prompt is no longer active" },
      { status: 400 },
    );
  }

  // Check for existing submission to handle image deletion
  const existingSubmission = await prisma.submission.findUnique({
    where: {
      userId_promptId_wordIndex: {
        userId: session.user.id,
        promptId,
        wordIndex,
      },
    },
  });

  // Delete old image from R2 if it's being replaced or removed
  if (
    existingSubmission?.imageUrl &&
    existingSubmission.imageUrl !== imageUrl
  ) {
    await deleteImageFromR2(existingSubmission.imageUrl);
  }

  // Upsert submission (create or update)
  const submission = await prisma.submission.upsert({
    where: {
      userId_promptId_wordIndex: {
        userId: session.user.id,
        promptId,
        wordIndex,
      },
    },
    update: {
      title,
      imageUrl,
      text,
    },
    create: {
      userId: session.user.id,
      promptId,
      wordIndex,
      title,
      imageUrl,
      text,
    },
  });

  return NextResponse.json({ submission });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const submissionId = searchParams.get("id");

  if (!submissionId) {
    return NextResponse.json(
      { error: "Submission ID is required" },
      { status: 400 },
    );
  }

  // Verify ownership
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission || submission.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Submission not found or unauthorized" },
      { status: 404 },
    );
  }

  // Delete image from R2 if it exists
  if (submission.imageUrl) {
    await deleteImageFromR2(submission.imageUrl);
  }

  await prisma.submission.delete({
    where: { id: submissionId },
  });

  return NextResponse.json({ success: true });
}
