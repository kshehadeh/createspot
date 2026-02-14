import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
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
  type?: "submission" | "profile" | "progression" | "reference";
  submissionId?: string; // Required when type is "progression" or "reference"
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as PresignRequest;
    const { fileType, fileSize, type = "submission", submissionId } = body;

    if (!fileType || typeof fileSize !== "number") {
      return NextResponse.json(
        { error: "fileType and fileSize are required" },
        { status: 400 },
      );
    }

    if (
      type !== "submission" &&
      type !== "profile" &&
      type !== "progression" &&
      type !== "reference"
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid type. Must be 'submission', 'profile', 'progression', or 'reference'",
        },
        { status: 400 },
      );
    }

    // Progression and reference uploads require a submissionId and ownership validation
    if (type === "progression" || type === "reference") {
      if (!submissionId) {
        return NextResponse.json(
          {
            error: `submissionId is required for ${type} uploads`,
          },
          { status: 400 },
        );
      }

      // Validate that the user owns the submission
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
          error: `File is too large (${fileSizeMB} MB). Maximum file size is 6 MB.`,
        },
        { status: 400 },
      );
    }

    if (fileSize <= 0) {
      return NextResponse.json({ error: "Invalid file size" }, { status: 400 });
    }

    const fileExtension = fileType.split("/")[1];

    // Determine folder structure based on type
    let fileName: string;
    if (type === "profile") {
      fileName = `profiles/${session.user.id}/${crypto.randomUUID()}.${fileExtension}`;
    } else if (type === "progression") {
      // Progressions are organized by submissionId for easy cleanup
      fileName = `progressions/${submissionId}/${crypto.randomUUID()}.${fileExtension}`;
    } else if (type === "reference") {
      fileName = `references/${submissionId}/${crypto.randomUUID()}.${fileExtension}`;
    } else {
      // Default: submissions organized by userId
      fileName = `submissions/${session.user.id}/${crypto.randomUUID()}.${fileExtension}`;
    }

    // Ensure the Key is correctly set for the presigned URL
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName, // This should be profiles/{userId}/{uuid}.{ext} for profile images
      ContentType: fileType,
      ContentLength: fileSize,
    });

    // Log for debugging (remove in production if needed)
    console.log(
      `[Presign] Generating presigned URL for Key: ${fileName}, type: ${type}${type === "progression" ? `, submissionId: ${submissionId}` : ""}`,
    );

    const presignedUrl = await getSignedUrl(s3Client, putCommand, {
      expiresIn: PRESIGN_EXPIRES_IN,
    });

    // Verify the presigned URL contains the correct Key path
    // The Key should be in the URL path, not just in query params
    const expectedFolder = fileName.split("/")[0];
    if (!presignedUrl.includes(expectedFolder)) {
      console.warn(
        `[Presign] Warning: Presigned URL may not contain correct Key path. Expected folder: ${expectedFolder}, Key: ${fileName}`,
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
