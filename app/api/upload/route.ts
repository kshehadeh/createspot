import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  applyWatermarkWithMargin,
  addImageMetadata,
  isValidWatermarkPosition,
  type WatermarkPosition,
} from "@/lib/watermark";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// GIF doesn't support watermarking well with Sharp, so we skip it
const WATERMARKABLE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string | null) || "submission";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (type !== "submission" && type !== "profile") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'submission' or 'profile'" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: `File is too large (${fileSizeMB} MB). Maximum file size is 10 MB. Please choose a smaller image.`,
        },
        { status: 400 },
      );
    }

    let buffer: Buffer = Buffer.from(await file.arrayBuffer());

    // Fetch user's protection settings for submissions only
    if (type === "submission") {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          enableWatermark: true,
          watermarkPosition: true,
          protectFromAI: true,
        },
      });

      if (user) {
        // Apply watermark if enabled and file type supports it
        if (user.enableWatermark && WATERMARKABLE_TYPES.includes(file.type)) {
          const position = isValidWatermarkPosition(user.watermarkPosition)
            ? user.watermarkPosition
            : "bottom-right";

          try {
            buffer = await applyWatermarkWithMargin(buffer, {
              position: position as WatermarkPosition,
              opacity: 0.5,
              sizeRatio: 0.12,
              marginRatio: 0.2,
            });
          } catch (watermarkError) {
            console.error("Watermark application failed:", watermarkError);
            // Continue without watermark if it fails
          }
        }

        // Add copyright metadata if AI protection is enabled
        if (user.protectFromAI && WATERMARKABLE_TYPES.includes(file.type)) {
          try {
            buffer = await addImageMetadata(
              buffer,
              user.name || "CreateSpot User",
            );
          } catch (metadataError) {
            console.error("Metadata injection failed:", metadataError);
            // Continue without metadata if it fails
          }
        }
      }
    }

    const fileExtension = file.type.split("/")[1];
    const folder = type === "profile" ? "profiles" : "submissions";
    const fileName = `${folder}/${session.user.id}/${crypto.randomUUID()}.${fileExtension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
