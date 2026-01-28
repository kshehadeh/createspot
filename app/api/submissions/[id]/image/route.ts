import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processImageForStorage } from "@/lib/upload-process";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/submissions/[id]/image
 * Replace the image for a submission with an edited version.
 * Runs through processImageForStorage (resize + WebP or GIF passthrough);
 * updates key if extension changes and sets imageProcessingMetadata.
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      imageUrl: true,
    },
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

  if (!submission.imageUrl) {
    return NextResponse.json(
      { error: "Submission has no image" },
      { status: 400 },
    );
  }

  const publicUrlBase = process.env.R2_PUBLIC_URL;
  const bucket = process.env.R2_BUCKET_NAME;
  if (
    !publicUrlBase ||
    !submission.imageUrl.startsWith(publicUrlBase) ||
    !bucket
  ) {
    return NextResponse.json(
      { error: "Invalid image URL format" },
      { status: 400 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await processImageForStorage(buffer);

    const oldKey = submission.imageUrl.replace(`${publicUrlBase}/`, "");
    const baseKeyWithoutExt = oldKey.replace(/\.[^.]+$/, "");
    const newKey = `${baseKeyWithoutExt}.${result.extension}`;
    const keyChanged = oldKey !== newKey;

    if (keyChanged) {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: newKey,
          Body: result.buffer,
          ContentType: result.contentType,
        }),
      );
      try {
        await s3Client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: oldKey }),
        );
      } catch (err) {
        console.error("Failed to delete old R2 object:", err);
      }
    } else {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: newKey,
          Body: result.buffer,
          ContentType: result.contentType,
        }),
      );
    }

    const newImageUrl = `${publicUrlBase}/${newKey}`;
    const now = new Date();
    const imageProcessingMetadata = {
      watermarked: false,
      compressed: true,
      format: result.extension,
    };

    await prisma.submission.update({
      where: { id },
      data: {
        imageUrl: newImageUrl,
        imageProcessingMetadata: imageProcessingMetadata as object,
        imageProcessedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      imageUrl: newImageUrl,
    });
  } catch (error) {
    console.error("Error saving edited image:", error);
    return NextResponse.json(
      { error: "Failed to save edited image" },
      { status: 500 },
    );
  }
}
