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
  const portfolio = searchParams.get("portfolio");
  const userId = searchParams.get("userId");

  // Portfolio items query
  if (portfolio === "true") {
    const targetUserId = userId || session.user.id;
    const isOwnProfile = targetUserId === session.user.id;

    // Build share status filter based on ownership
    const shareStatusFilter = isOwnProfile
      ? {} // Owner sees all their items
      : { shareStatus: { in: ["PROFILE" as const, "PUBLIC" as const] } }; // Others see PROFILE and PUBLIC only

    const submissions = await prisma.submission.findMany({
      where: {
        userId: targetUserId,
        isPortfolio: true,
        ...shareStatusFilter,
      },
      orderBy: [
        { portfolioOrder: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        prompt: {
          select: {
            word1: true,
            word2: true,
            word3: true,
          },
        },
        _count: {
          select: { favorites: true },
        },
      },
    });

    return NextResponse.json({ submissions });
  }

  // Prompt-specific query (original behavior)
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
  const {
    promptId,
    wordIndex,
    title,
    imageUrl,
    text,
    isPortfolio,
    tags,
    category,
    shareStatus,
  } = body;

  // Portfolio-only item (no prompt association)
  if (!promptId && isPortfolio) {
    // Validate that we have at least some content
    if (!imageUrl && !text) {
      return NextResponse.json(
        { error: "Portfolio item must have an image or text" },
        { status: 400 },
      );
    }

    // Validate shareStatus if provided
    const validShareStatuses = ["PRIVATE", "PROFILE", "PUBLIC"];
    const finalShareStatus =
      shareStatus && validShareStatuses.includes(shareStatus)
        ? shareStatus
        : "PUBLIC";

    const submission = await prisma.submission.create({
      data: {
        userId: session.user.id,
        promptId: null,
        wordIndex: null,
        title: title || null,
        imageUrl: imageUrl || null,
        text: text || null,
        isPortfolio: true,
        tags: tags || [],
        category: category || null,
        shareStatus: finalShareStatus,
      },
    });

    return NextResponse.json({ submission });
  }

  // Prompt submission (original behavior with optional portfolio flag)
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
  // Prompt submissions are always PUBLIC
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
      isPortfolio: isPortfolio ?? existingSubmission?.isPortfolio ?? false,
      tags: tags ?? existingSubmission?.tags ?? [],
      category: category ?? existingSubmission?.category ?? null,
      shareStatus: "PUBLIC", // Prompt submissions are always public
    },
    create: {
      userId: session.user.id,
      promptId,
      wordIndex,
      title,
      imageUrl,
      text,
      isPortfolio: isPortfolio ?? false,
      tags: tags ?? [],
      category: category ?? null,
      shareStatus: "PUBLIC", // Prompt submissions are always public
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
  const promptId = searchParams.get("promptId");

  // If promptId is provided, clear all submissions for that prompt
  if (promptId) {
    // Get all submissions for this user and prompt
    const submissions = await prisma.submission.findMany({
      where: {
        userId: session.user.id,
        promptId,
      },
    });

    // Delete all images from R2
    for (const submission of submissions) {
      if (submission.imageUrl) {
        await deleteImageFromR2(submission.imageUrl);
      }
    }

    // Delete all submissions
    await prisma.submission.deleteMany({
      where: {
        userId: session.user.id,
        promptId,
      },
    });

    return NextResponse.json({ success: true });
  }

  // Otherwise, delete a single submission by ID
  if (!submissionId) {
    return NextResponse.json(
      { error: "Submission ID or Prompt ID is required" },
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
