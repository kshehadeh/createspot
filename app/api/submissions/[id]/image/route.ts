import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/submissions/[id]/image
 * Replace the image for a submission with an edited version
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

  // Verify ownership
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

  try {
    // Get the image file from request
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 },
      );
    }

    // Extract R2 key from existing imageUrl
    const publicUrl = process.env.R2_PUBLIC_URL;
    if (!publicUrl || !submission.imageUrl.startsWith(publicUrl)) {
      return NextResponse.json(
        { error: "Invalid image URL format" },
        { status: 400 },
      );
    }

    const r2Key = submission.imageUrl.replace(`${publicUrl}/`, "");

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2, replacing the existing file
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: r2Key,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    // Image URL stays the same (same R2 key), so no database update needed
    // Return the imageUrl for the client
    return NextResponse.json({
      success: true,
      imageUrl: submission.imageUrl,
    });
  } catch (error) {
    console.error("Error saving edited image:", error);
    return NextResponse.json(
      { error: "Failed to save edited image" },
      { status: 500 },
    );
  }
}
