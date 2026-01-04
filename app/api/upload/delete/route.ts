import { NextRequest, NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

interface DeleteRequest {
  imageUrl: string;
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as DeleteRequest;
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 },
      );
    }

    // Extract the key from the public URL
    const publicUrlPrefix = process.env.R2_PUBLIC_URL;
    if (!publicUrlPrefix || !imageUrl.startsWith(publicUrlPrefix)) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    const key = imageUrl.slice(publicUrlPrefix.length + 1); // +1 for the trailing slash

    // Security: Only allow users to delete their own files
    // Files are stored as {userId}/{uuid}.{ext}
    if (!key.startsWith(`${session.user.id}/`)) {
      return NextResponse.json(
        { error: "Not authorized to delete this file" },
        { status: 403 },
      );
    }

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      }),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}
