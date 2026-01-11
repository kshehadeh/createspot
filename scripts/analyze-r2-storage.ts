#!/usr/bin/env bun

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";

interface R2Object {
  key: string;
  size: number;
  lastModified?: Date;
}

interface DatabaseImage {
  url: string;
  key: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  type: "submission" | "profile";
  submissionId?: string;
}

interface UserStats {
  userId: string;
  userName: string | null;
  userEmail: string;
  totalImages: number;
  totalSize: number;
  submissionImages: number;
  profileImages: number;
  submissionSize: number;
  profileSize: number;
}

interface ReportData {
  totalObjects: number;
  totalSize: number;
  referencedObjects: number;
  orphanedObjects: number;
  missingObjects: number;
  orphanedSize: number;
  missingSize: number;
  userStats: UserStats[];
  orphanedFiles: R2Object[];
  missingFiles: DatabaseImage[];
  folderStructure: {
    oldFormat: { count: number; size: number };
    submissions: { count: number; size: number };
    profiles: { count: number; size: number };
    other: { count: number; size: number };
  };
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

async function listAllR2Objects(s3Client: S3Client, bucketName: string): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      ContinuationToken: continuationToken,
    });

    const response = await s3Client.send(command);

    if (response.Contents) {
      for (const object of response.Contents) {
        if (object.Key && object.Size !== undefined) {
          objects.push({
            key: object.Key,
            size: object.Size,
            lastModified: object.LastModified,
          });
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objects;
}

async function queryDatabaseImages(publicUrl: string): Promise<DatabaseImage[]> {
  const images: DatabaseImage[] = [];

  // Query submission images
  const submissions = await prisma.submission.findMany({
    where: {
      imageUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      imageUrl: true,
      userId: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  for (const submission of submissions) {
    const key = extractR2Key(submission.imageUrl, publicUrl);
    if (key && submission.imageUrl) {
      images.push({
        url: submission.imageUrl,
        key,
        userId: submission.userId,
        userName: submission.user.name,
        userEmail: submission.user.email,
        type: "submission",
        submissionId: submission.id,
      });
    }
  }

  // Query user profile images
  const users = await prisma.user.findMany({
    where: {
      profileImageUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      profileImageUrl: true,
    },
  });

  for (const user of users) {
    const key = extractR2Key(user.profileImageUrl, publicUrl);
    if (key && user.profileImageUrl) {
      images.push({
        url: user.profileImageUrl,
        key,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: "profile",
      });
    }
  }

  return images;
}

function generateReport(
  r2Objects: R2Object[],
  dbImages: DatabaseImage[],
): ReportData {
  // Create maps for efficient lookup
  const r2ObjectMap = new Map<string, R2Object>();
  const dbImageMap = new Map<string, DatabaseImage>();

  for (const obj of r2Objects) {
    r2ObjectMap.set(obj.key, obj);
  }

  for (const img of dbImages) {
    dbImageMap.set(img.key, img);
  }

  // Find referenced and orphaned objects
  const referencedKeys = new Set<string>();
  const orphanedFiles: R2Object[] = [];
  let orphanedSize = 0;

  for (const obj of r2Objects) {
    if (dbImageMap.has(obj.key)) {
      referencedKeys.add(obj.key);
    } else {
      orphanedFiles.push(obj);
      orphanedSize += obj.size;
    }
  }

  // Find missing files (in DB but not in R2)
  const missingFiles: DatabaseImage[] = [];
  for (const img of dbImages) {
    if (!r2ObjectMap.has(img.key)) {
      missingFiles.push(img);
    }
  }

  // Calculate per-user statistics
  const userStatsMap = new Map<string, UserStats>();

  for (const img of dbImages) {
    const r2Obj = r2ObjectMap.get(img.key);
    if (!r2Obj) continue; // Skip missing files in stats

    let stats = userStatsMap.get(img.userId);
    if (!stats) {
      stats = {
        userId: img.userId,
        userName: img.userName,
        userEmail: img.userEmail,
        totalImages: 0,
        totalSize: 0,
        submissionImages: 0,
        profileImages: 0,
        submissionSize: 0,
        profileSize: 0,
      };
      userStatsMap.set(img.userId, stats);
    }

    stats.totalImages++;
    stats.totalSize += r2Obj.size;

    if (img.type === "submission") {
      stats.submissionImages++;
      stats.submissionSize += r2Obj.size;
    } else {
      stats.profileImages++;
      stats.profileSize += r2Obj.size;
    }
  }

  const totalSize = r2Objects.reduce((sum, obj) => sum + obj.size, 0);
  const missingSize = missingFiles.reduce((sum) => {
    // We don't know the size of missing files, so we'll estimate 0
    return sum;
  }, 0);

  // Analyze folder structure
  const folderStructure = {
    oldFormat: { count: 0, size: 0 },
    submissions: { count: 0, size: 0 },
    profiles: { count: 0, size: 0 },
    other: { count: 0, size: 0 },
  };

  for (const obj of r2Objects) {
    if (obj.key.startsWith("submissions/")) {
      folderStructure.submissions.count++;
      folderStructure.submissions.size += obj.size;
    } else if (obj.key.startsWith("profiles/")) {
      folderStructure.profiles.count++;
      folderStructure.profiles.size += obj.size;
    } else if (!obj.key.includes("/") || obj.key.match(/^[^/]+\/[^/]+$/)) {
      // Old format: {userId}/{uuid}.{ext} (no folder prefix, single level)
      folderStructure.oldFormat.count++;
      folderStructure.oldFormat.size += obj.size;
    } else {
      folderStructure.other.count++;
      folderStructure.other.size += obj.size;
    }
  }

  return {
    totalObjects: r2Objects.length,
    totalSize,
    referencedObjects: referencedKeys.size,
    orphanedObjects: orphanedFiles.length,
    missingObjects: missingFiles.length,
    orphanedSize,
    missingSize,
    userStats: Array.from(userStatsMap.values()).sort(
      (a, b) => b.totalSize - a.totalSize,
    ),
    orphanedFiles: orphanedFiles.sort((a, b) => b.size - a.size),
    missingFiles,
    folderStructure,
  };
}

function printReport(data: ReportData): void {
  console.log("\n" + "=".repeat(80));
  console.log("R2 STORAGE ANALYSIS REPORT");
  console.log("=".repeat(80) + "\n");

  // Summary Statistics
  console.log("SUMMARY STATISTICS");
  console.log("-".repeat(80));
  console.log(`Total objects in R2:        ${data.totalObjects.toLocaleString()}`);
  console.log(`Total storage size:          ${formatSize(data.totalSize)}`);
  console.log(`Referenced in database:      ${data.referencedObjects.toLocaleString()}`);
  console.log(`Orphaned (not in DB):        ${data.orphanedObjects.toLocaleString()} (${formatSize(data.orphanedSize)})`);
  console.log(`Missing (in DB, not in R2):  ${data.missingObjects.toLocaleString()}`);
  console.log("");

  // Folder Structure Breakdown
  console.log("FOLDER STRUCTURE");
  console.log("-".repeat(80));
  console.log(`Old format ({userId}/...):    ${data.folderStructure.oldFormat.count.toLocaleString()} files (${formatSize(data.folderStructure.oldFormat.size)})`);
  console.log(`submissions/ folder:          ${data.folderStructure.submissions.count.toLocaleString()} files (${formatSize(data.folderStructure.submissions.size)})`);
  console.log(`profiles/ folder:             ${data.folderStructure.profiles.count.toLocaleString()} files (${formatSize(data.folderStructure.profiles.size)})`);
  if (data.folderStructure.other.count > 0) {
    console.log(`Other locations:             ${data.folderStructure.other.count.toLocaleString()} files (${formatSize(data.folderStructure.other.size)})`);
  }
  console.log("");

  // Per-User Breakdown
  console.log("PER-USER BREAKDOWN");
  console.log("-".repeat(80));
  if (data.userStats.length === 0) {
    console.log("No users with images found.");
  } else {
    console.log(
      `${"User".padEnd(30)} ${"Email".padEnd(30)} ${"Images".padStart(8)} ${"Size".padStart(12)} ${"Submissions".padStart(12)} ${"Profiles".padStart(8)}`,
    );
    console.log("-".repeat(80));
    for (const stats of data.userStats) {
      const name = (stats.userName || "Unknown").padEnd(30);
      const email = stats.userEmail.padEnd(30);
      const images = stats.totalImages.toString().padStart(8);
      const size = formatSize(stats.totalSize).padStart(12);
      const submissions = `${stats.submissionImages} (${formatSize(stats.submissionSize)})`.padStart(12);
      const profiles = `${stats.profileImages} (${formatSize(stats.profileSize)})`.padStart(8);
      console.log(`${name} ${email} ${images} ${size} ${submissions} ${profiles}`);
    }
  }
  console.log("");

  // Orphaned Files
  if (data.orphanedFiles.length > 0) {
    console.log("ORPHANED FILES (in R2 but not referenced in database)");
    console.log("-".repeat(80));
    console.log(`Total: ${data.orphanedFiles.length} files, ${formatSize(data.orphanedSize)}`);
    console.log("");
    console.log("Top 20 largest orphaned files:");
    console.log(
      `${"Key".padEnd(60)} ${"Size".padStart(12)} ${"Last Modified".padStart(20)}`,
    );
    console.log("-".repeat(80));
    for (const file of data.orphanedFiles.slice(0, 20)) {
      const key = file.key.padEnd(60);
      const size = formatSize(file.size).padStart(12);
      const modified = file.lastModified
        ? file.lastModified.toISOString().split("T")[0]
        : "Unknown";
      console.log(`${key} ${size} ${modified}`);
    }
    if (data.orphanedFiles.length > 20) {
      console.log(`... and ${data.orphanedFiles.length - 20} more files`);
    }
    console.log("");
  }

  // Missing Files
  if (data.missingFiles.length > 0) {
    console.log("MISSING FILES (referenced in database but not found in R2)");
    console.log("-".repeat(80));
    console.log(`Total: ${data.missingFiles.length} files`);
    console.log("");
    console.log(
      `${"User".padEnd(30)} ${"Type".padEnd(12)} ${"Key".padEnd(50)}`,
    );
    console.log("-".repeat(80));
    for (const file of data.missingFiles.slice(0, 50)) {
      const user = (file.userName || file.userEmail).padEnd(30);
      const type = file.type.padEnd(12);
      const key = file.key.padEnd(50);
      console.log(`${user} ${type} ${key}`);
    }
    if (data.missingFiles.length > 50) {
      console.log(`... and ${data.missingFiles.length - 50} more files`);
    }
    console.log("");
  }

  console.log("=".repeat(80));
}

async function main(): Promise<void> {
  // Validate environment variables
  const requiredEnvVars = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_URL",
    "DATABASE_URL",
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("Error: Missing required environment variables:");
    for (const varName of missingVars) {
      console.error(`  - ${varName}`);
    }
    process.exit(1);
  }

  const bucketName = process.env.R2_BUCKET_NAME!;
  const publicUrl = process.env.R2_PUBLIC_URL!;

  // Initialize S3Client
  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  try {
    console.log("Fetching R2 objects...");
    const r2Objects = await listAllR2Objects(s3Client, bucketName);
    console.log(`Found ${r2Objects.length} objects in R2`);

    console.log("Querying database for image URLs...");
    const dbImages = await queryDatabaseImages(publicUrl);
    console.log(`Found ${dbImages.length} image references in database`);

    console.log("Generating report...");
    const reportData = generateReport(r2Objects, dbImages);

    printReport(reportData);
  } catch (error) {
    console.error("Error analyzing R2 storage:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Script failed:", error);
  process.exit(1);
});
