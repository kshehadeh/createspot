import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface R2Object {
  key: string;
  size: number;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function extractR2Key(url: string | null, publicUrl: string): string | null {
  if (!url) return null;
  if (!url.startsWith(publicUrl)) return null;
  return url.replace(`${publicUrl}/`, "");
}

async function listR2ObjectsWithPrefix(
  s3Client: S3Client,
  bucketName: string,
  prefix: string,
): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key && object.Size !== undefined) {
          objects.push({
            key: object.Key,
            size: object.Size,
          });
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objects;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;

  try {
    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        profileImageUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user's submissions
    const submissions = await prisma.submission.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Initialize S3 client for R2
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = process.env.R2_BUCKET_NAME!;
    const publicUrl = process.env.R2_PUBLIC_URL!;

    // Fetch R2 objects for this user
    const [submissionObjects, profileObjects] = await Promise.all([
      listR2ObjectsWithPrefix(s3Client, bucketName, `submissions/${userId}/`),
      listR2ObjectsWithPrefix(s3Client, bucketName, `profiles/${userId}/`),
    ]);

    // Create a map of R2 keys to sizes
    const r2SizeMap = new Map<string, number>();
    for (const obj of [...submissionObjects, ...profileObjects]) {
      r2SizeMap.set(obj.key, obj.size);
    }

    // Calculate storage totals
    const submissionsBytes = submissionObjects.reduce(
      (sum, obj) => sum + obj.size,
      0,
    );
    const profileBytes = profileObjects.reduce((sum, obj) => sum + obj.size, 0);
    const totalBytes = submissionsBytes + profileBytes;

    // Map submissions with their image sizes
    const submissionItems = submissions.map((submission) => {
      const r2Key = extractR2Key(submission.imageUrl, publicUrl);
      const imageSize = r2Key ? (r2SizeMap.get(r2Key) ?? null) : null;

      return {
        id: submission.id,
        title: submission.title,
        createdAt: submission.createdAt,
        imageSize,
        formattedSize: imageSize !== null ? formatSize(imageSize) : null,
      };
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      submissions: {
        total: submissions.length,
        items: submissionItems,
      },
      storage: {
        totalBytes,
        submissionsBytes,
        profileBytes,
        formattedTotal: formatSize(totalBytes),
        formattedSubmissions: formatSize(submissionsBytes),
        formattedProfile: formatSize(profileBytes),
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user statistics" },
      { status: 500 },
    );
  }
}
