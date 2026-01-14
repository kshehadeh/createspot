import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// Types that support watermarking
const WATERMARKABLE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PRESIGN_EXPIRES_IN = 300; // 5 minutes

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

interface PresignRequest {
  fileType: string;
  fileSize: number;
  type?: "submission" | "profile";
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as PresignRequest;
    const { fileType, fileSize, type = "submission" } = body;

    // For submissions, check if user has watermarking enabled
    // If so, they need to use the server-side upload route instead
    if (type === "submission" && WATERMARKABLE_TYPES.includes(fileType)) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { enableWatermark: true },
      });

      if (user?.enableWatermark) {
        // Tell the client to use server-side upload for watermarking
        return NextResponse.json({
          useServerUpload: true,
          reason: "Watermarking requires server-side upload",
        });
      }
    }

    if (!fileType || typeof fileSize !== "number") {
      return NextResponse.json(
        { error: "fileType and fileSize are required" },
        { status: 400 },
      );
    }

    if (type !== "submission" && type !== "profile") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'submission' or 'profile'" },
        { status: 400 },
      );
    }

    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 },
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: `File is too large (${fileSizeMB} MB). Maximum file size is 10 MB.`,
        },
        { status: 400 },
      );
    }

    if (fileSize <= 0) {
      return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
    }

    const fileExtension = fileType.split("/")[1];
    const folder = type === "profile" ? "profiles" : "submissions";
    const fileName = `${folder}/${session.user.id}/${crypto.randomUUID()}.${fileExtension}`;

    // Ensure the Key is correctly set for the presigned URL
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName, // This should be profiles/{userId}/{uuid}.{ext} for profile images
      ContentType: fileType,
      ContentLength: fileSize,
    });

    // Log for debugging (remove in production if needed)
    console.log(
      `[Presign] Generating presigned URL for Key: ${fileName}, type: ${type}`,
    );

    const presignedUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: PRESIGN_EXPIRES_IN,
    });

    // Verify the presigned URL contains the correct Key path
    // The Key should be in the URL path, not just in query params
    if (!presignedUrl.includes(fileName.split("/")[0])) {
      console.warn(
        `[Presign] Warning: Presigned URL may not contain correct Key path. Expected folder: ${folder}, Key: ${fileName}`,
      );
    }

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    return NextResponse.json({
      presignedUrl,
      publicUrl,
      expiresIn: PRESIGN_EXPIRES_IN,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
