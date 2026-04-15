import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { revalidateTag } from "next/cache";
import { after, NextRequest, NextResponse } from "next/server";
import { processUploadedImage } from "@/app/(app)/workflows/process-uploaded-image";
import { sendNewFollowerPostNotification } from "@/app/(app)/workflows/send-new-follower-post-notification";
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

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const portfolio = searchParams.get("portfolio");
  const userId = searchParams.get("userId");

  if (portfolio !== "true") {
    return NextResponse.json(
      { error: "portfolio=true is required" },
      { status: 400 },
    );
  }

  const targetUserId = userId || session.user.id;
  const isOwnProfile = targetUserId === session.user.id;

  const shareStatusFilter = isOwnProfile
    ? {}
    : { shareStatus: { in: ["PROFILE" as const, "PUBLIC" as const] } };

  const submissions = await prisma.submission.findMany({
    where: {
      userId: targetUserId,
      isPortfolio: true,
      ...shareStatusFilter,
    },
    orderBy: [{ portfolioOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: { favorites: true },
      },
      progressions: {
        orderBy: { order: "desc" },
        take: 1,
        select: {
          imageUrl: true,
          text: true,
        },
      },
    },
  });

  const mapped = submissions.map((s) => {
    const latest = s.progressions?.[0];
    return {
      ...s,
      latestProgressionImageUrl: latest?.imageUrl ?? null,
      latestProgressionText: latest?.text ?? null,
      progressions: undefined,
    };
  });

  return NextResponse.json({ submissions: mapped });
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    isWorkInProgress,
  } = body;

  if (!isPortfolio) {
    return NextResponse.json(
      { error: "Only portfolio submissions are supported" },
      { status: 400 },
    );
  }

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

  if (!imageUrl && !text && !isWorkInProgress) {
    return NextResponse.json(
      { error: "Portfolio item must have an image or text" },
      { status: 400 },
    );
  }

  const validShareStatuses = ["PRIVATE", "PROFILE", "PUBLIC"];
  const finalShareStatus =
    shareStatus && validShareStatuses.includes(shareStatus)
      ? shareStatus
      : "PRIVATE";

  const submission = await prisma.submission.create({
    data: {
      userId: session.user.id,
      title: title || null,
      imageUrl: imageUrl || null,
      imageFocalPoint: imageFocalPoint !== undefined ? imageFocalPoint : null,
      text: text || null,
      isPortfolio: true,
      tags: tags || [],
      category: category || null,
      shareStatus: finalShareStatus,
      critiquesEnabled: critiquesEnabled ?? false,
      isWorkInProgress: isWorkInProgress ?? false,
    },
  });

  const r2Base = process.env.R2_PUBLIC_URL;
  if (submission.imageUrl && r2Base && submission.imageUrl.startsWith(r2Base)) {
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

  if (finalShareStatus === "PROFILE" || finalShareStatus === "PUBLIC") {
    after(async () => {
      try {
        await sendNewFollowerPostNotification({
          submissionId: submission.id,
          creatorId: session.user.id,
        });
      } catch (err) {
        console.error("[send-new-follower-post-notification]", err);
      }
    });
  }

  revalidateTag("exhibition-facets", "max");
  revalidateTag("exhibition-submissions", "max");
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

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission || submission.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Submission not found or unauthorized" },
      { status: 404 },
    );
  }

  if (submission.imageUrl) {
    await deleteImageFromR2(submission.imageUrl);
  }

  await prisma.submission.delete({
    where: { id: submissionId },
  });

  revalidateTag("exhibition-facets", "max");
  revalidateTag("exhibition-submissions", "max");
  return NextResponse.json({ success: true });
}
