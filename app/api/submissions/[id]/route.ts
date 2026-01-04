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

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const session = await auth();

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          instagram: true,
          twitter: true,
          linkedin: true,
          website: true,
        },
      },
      prompt: {
        select: {
          id: true,
          word1: true,
          word2: true,
          word3: true,
          weekStart: true,
          weekEnd: true,
        },
      },
      _count: {
        select: {
          favorites: true,
        },
      },
    },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  // Check share status visibility
  // PRIVATE submissions are only visible to the owner
  if (submission.shareStatus === "PRIVATE") {
    if (!session?.user || session.user.id !== submission.userId) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }
  }
  // PROFILE and PUBLIC are visible to everyone

  return NextResponse.json({ submission });
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const existingSubmission = await prisma.submission.findUnique({
    where: { id },
  });

  if (!existingSubmission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  if (existingSubmission.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const {
    title,
    imageUrl,
    text,
    isPortfolio,
    tags,
    category,
    promptId,
    wordIndex,
    shareStatus,
  } = body;

  // If linking to a prompt, validate it
  if (promptId !== undefined && promptId !== null) {
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Check if this prompt slot is already taken by another submission
    if (wordIndex) {
      const existingSlot = await prisma.submission.findUnique({
        where: {
          userId_promptId_wordIndex: {
            userId: session.user.id,
            promptId,
            wordIndex,
          },
        },
      });

      if (existingSlot && existingSlot.id !== id) {
        return NextResponse.json(
          { error: "This prompt slot is already filled" },
          { status: 400 },
        );
      }
    }
  }

  // Delete old image from R2 if it's being replaced or removed
  if (
    imageUrl !== undefined &&
    existingSubmission.imageUrl &&
    existingSubmission.imageUrl !== imageUrl
  ) {
    await deleteImageFromR2(existingSubmission.imageUrl);
  }

  // Build update data - only include fields that were provided
  const updateData: Record<string, unknown> = {};

  if (title !== undefined) updateData.title = title;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (text !== undefined) updateData.text = text;
  if (isPortfolio !== undefined) updateData.isPortfolio = isPortfolio;
  if (tags !== undefined) updateData.tags = tags;
  if (category !== undefined) updateData.category = category;
  if (promptId !== undefined) updateData.promptId = promptId;
  if (wordIndex !== undefined) updateData.wordIndex = wordIndex;

  // Handle shareStatus - if linking to a prompt, force PUBLIC
  if (promptId !== undefined && promptId !== null) {
    // Linking to a prompt makes it PUBLIC
    updateData.shareStatus = "PUBLIC";
  } else if (shareStatus !== undefined) {
    // Validate shareStatus if provided
    const validShareStatuses = ["PRIVATE", "PROFILE", "PUBLIC"];
    if (validShareStatuses.includes(shareStatus)) {
      updateData.shareStatus = shareStatus;
    }
  }

  const submission = await prisma.submission.update({
    where: { id },
    data: updateData,
    include: {
      prompt: {
        select: {
          word1: true,
          word2: true,
          word3: true,
        },
      },
    },
  });

  return NextResponse.json({ submission });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const submission = await prisma.submission.findUnique({
    where: { id },
  });

  if (!submission) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 },
    );
  }

  if (submission.userId !== session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Delete image from R2 if it exists
  if (submission.imageUrl) {
    await deleteImageFromR2(submission.imageUrl);
  }

  await prisma.submission.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
