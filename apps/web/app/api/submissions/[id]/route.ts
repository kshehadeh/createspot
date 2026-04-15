import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { revalidateTag } from "next/cache";
import { after, NextRequest, NextResponse } from "next/server";
import { processUploadedImage } from "@/app/(app)/workflows/process-uploaded-image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getR2KeyFromPublicUrl } from "@/lib/r2-url";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function deleteImageFromR2(imageUrl: string): Promise<void> {
  const key = getR2KeyFromPublicUrl(imageUrl, process.env.R2_PUBLIC_URL);
  if (!key) return;
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
  const [session, submission] = await Promise.all([
    auth(),
    prisma.submission.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            slug: true,
            instagram: true,
            twitter: true,
            linkedin: true,
            website: true,
          },
        },
        _count: {
          select: {
            favorites: true,
          },
        },
      },
    }),
  ]);

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
    imageFocalPoint,
    text,
    isPortfolio,
    tags,
    category,
    shareStatus,
    critiquesEnabled,
    referenceImageUrl,
    isWorkInProgress,
  } = body;

  // Validate focal point if provided
  if (imageFocalPoint !== undefined && imageFocalPoint !== null) {
    if (
      typeof imageFocalPoint !== "object" ||
      typeof imageFocalPoint.x !== "number" ||
      typeof imageFocalPoint.y !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid focal point format. Must be {x: number, y: number}" },
        { status: 400 },
      );
    }

    const { x, y } = imageFocalPoint;
    if (x < 0 || x > 100 || y < 0 || y > 100) {
      return NextResponse.json(
        { error: "Focal point coordinates must be between 0 and 100" },
        { status: 400 },
      );
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

  // Delete old reference image from R2 if it's being replaced or removed
  if (
    referenceImageUrl !== undefined &&
    existingSubmission.referenceImageUrl &&
    existingSubmission.referenceImageUrl !== referenceImageUrl
  ) {
    await deleteImageFromR2(existingSubmission.referenceImageUrl);
  }

  // Build update data - only include fields that were provided
  const updateData: Record<string, unknown> = {};

  if (title !== undefined) updateData.title = title;
  if (imageUrl !== undefined) {
    updateData.imageUrl = imageUrl;
    // Clear processing metadata when image changes; workflow will set it when done
    updateData.imageProcessingMetadata = null;
    updateData.imageProcessedAt = null;
  }
  if (imageFocalPoint !== undefined)
    updateData.imageFocalPoint = imageFocalPoint;
  if (text !== undefined) updateData.text = text;
  if (isPortfolio !== undefined) updateData.isPortfolio = isPortfolio;
  if (tags !== undefined) updateData.tags = tags;
  if (category !== undefined) updateData.category = category;
  if (critiquesEnabled !== undefined)
    updateData.critiquesEnabled = critiquesEnabled;
  if (referenceImageUrl !== undefined)
    updateData.referenceImageUrl = referenceImageUrl;
  if (isWorkInProgress !== undefined)
    updateData.isWorkInProgress = isWorkInProgress;

  if (shareStatus !== undefined) {
    const validShareStatuses = ["PRIVATE", "PROFILE", "PUBLIC"];
    if (validShareStatuses.includes(shareStatus)) {
      updateData.shareStatus = shareStatus;
    }
  }

  const submission = await prisma.submission.update({
    where: { id },
    data: updateData,
  });

  // Trigger post-processing (compression/watermark) after response is sent
  const r2Base = process.env.R2_PUBLIC_URL;
  if (submission.imageUrl && r2Base && submission.imageUrl.startsWith(r2Base)) {
    const metadata = submission.imageProcessingMetadata as {
      compressed?: boolean;
    } | null;
    const imageChanged = imageUrl !== undefined;
    const notYetProcessed = metadata?.compressed !== true;
    const needsProcessing = imageChanged || notYetProcessed;
    if (needsProcessing) {
      after(async () => {
        try {
          await processUploadedImage({
            publicUrl: submission.imageUrl!,
            type: "submission",
            userId: session.user.id,
            submissionId: submission.id,
          });
        } catch (err) {
          console.error("[process-uploaded-image]", err);
        }
      });
    }
  }

  revalidateTag("exhibition-facets", "max");
  revalidateTag("exhibition-submissions", "max");
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

  revalidateTag("exhibition-facets", "max");
  revalidateTag("exhibition-submissions", "max");
  return NextResponse.json({ success: true });
}
