import { NextRequest, NextResponse } from "next/server";
import {
  S3Client,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
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

interface DeleteUserRequest {
  userId?: string;
}

/**
 * List all R2 objects for a specific user
 */
async function listUserR2Objects(
  userId: string,
): Promise<Array<{ key: string }>> {
  const objects: Array<{ key: string }> = [];
  const bucketName = process.env.R2_BUCKET_NAME!;

  // Check three possible prefixes:
  // 1. submissions/{userId}/
  // 2. profiles/{userId}/
  // 3. {userId}/ (old format)
  const prefixes = [
    `submissions/${userId}/`,
    `profiles/${userId}/`,
    `${userId}/`,
  ];

  for (const prefix of prefixes) {
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
          if (object.Key) {
            objects.push({ key: object.Key });
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
  }

  return objects;
}

/**
 * Delete all R2 objects for a user
 */
async function deleteUserR2Objects(userId: string): Promise<void> {
  const objects = await listUserR2Objects(userId);
  const bucketName = process.env.R2_BUCKET_NAME!;

  // Delete all objects (best effort - continue even if some fail)
  const deletePromises = objects.map(async (obj) => {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: obj.key,
        }),
      );
    } catch (error) {
      // Log error but continue with other deletions
      console.error(`Failed to delete R2 object ${obj.key}:`, error);
    }
  });

  await Promise.allSettled(deletePromises);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as DeleteUserRequest;
    const { userId: targetUserId } = body;

    // Determine target user ID
    let userIdToDelete: string;

    if (targetUserId) {
      // Admin deletion path
      if (!session.user.isAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Admin access required" },
          { status: 403 },
        );
      }

      // Prevent admin from deleting themselves via admin path
      if (targetUserId === session.user.id) {
        return NextResponse.json(
          { error: "Cannot delete your own account via admin interface" },
          { status: 400 },
        );
      }

      userIdToDelete = targetUserId;
    } else {
      // Self-deletion path
      userIdToDelete = session.user.id;
    }

    // Verify user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userIdToDelete },
      select: { id: true },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete all R2 objects for the user
    console.log(`Deleting R2 objects for user ${userIdToDelete}`);
    await deleteUserR2Objects(userIdToDelete);

    // Delete user (cascades will handle related records)
    console.log(`Deleting user ${userIdToDelete}`);
    await prisma.user.delete({
      where: { id: userIdToDelete },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete user account",
      },
      { status: 500 },
    );
  }
}
