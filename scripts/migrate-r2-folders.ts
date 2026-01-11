#!/usr/bin/env bun

import {
  S3Client,
  ListObjectsV2Command,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { PrismaClient } from "@/app/generated/prisma/client";

interface MigrationItem {
  oldKey: string;
  newKey: string;
  type: "submission" | "profile";
  userId: string;
  size: number;
  dbRecordId: string; // submission.id or user.id
  url: string; // Current URL in database
}

interface MigrationStats {
  totalFiles: number;
  submissionFiles: number;
  profileFiles: number;
  orphanedFiles: number;
  totalSize: number;
  migrated: number;
  errors: number;
}

function printUsage(): void {
  console.log(
    [
      "Usage:",
      "  bun scripts/migrate-r2-folders.ts [databaseUrl] [--execute]",
      "",
      "Arguments:",
      "  [databaseUrl]  Optional database URL. If not provided, uses DATABASE_URL env var.",
      "",
      "Options:",
      "  --execute      Execute the migration (default is dry-run)",
      "  --help, -h     Show this help message",
      "",
      "Examples:",
      "  bun scripts/migrate-r2-folders.ts",
      "  bun scripts/migrate-r2-folders.ts --execute",
      "  bun scripts/migrate-r2-folders.ts postgresql://user:pass@host:5432/dbname",
      "  bun scripts/migrate-r2-folders.ts postgresql://user:pass@host:5432/dbname --execute",
      "  PRODUCTION_DATABASE_URL=postgresql://user:pass@host:5432/dbname bun scripts/migrate-r2-folders.ts --execute",
      "",
      "Notes:",
      "  - By default, runs in dry-run mode (preview only)",
      "  - Use --execute to actually migrate files and update database",
    ].join("\n"),
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function isOldFormat(key: string): boolean {
  // Old format: {userId}/{uuid}.{ext}
  // New format: submissions/{userId}/... or profiles/{userId}/...
  return !key.startsWith("submissions/") && !key.startsWith("profiles/");
}

async function listAllR2Objects(
  s3Client: S3Client,
  bucketName: string,
): Promise<Array<{ key: string; size: number }>> {
  const objects: Array<{ key: string; size: number }> = [];
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
          });
        }
      }
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objects;
}

async function buildMigrationPlan(
  s3Client: S3Client,
  bucketName: string,
  publicUrl: string,
  prisma: PrismaClient,
): Promise<{
  items: MigrationItem[];
  orphaned: Array<{ key: string; size: number }>;
  stats: MigrationStats;
}> {
  console.log("Fetching all R2 objects...");
  const r2Objects = await listAllR2Objects(s3Client, bucketName);
  console.log(`Found ${r2Objects.length} objects in R2`);

  // Filter to only old format files
  const oldFormatFiles = r2Objects.filter((obj) => isOldFormat(obj.key));
  console.log(`Found ${oldFormatFiles.length} files in old format`);

  console.log("Querying database for image references...");

  // Build a map of URL -> database record
  const urlToRecord = new Map<
    string,
    {
      type: "submission" | "profile";
      userId: string;
      recordId: string;
    }
  >();

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
    },
  });

  for (const submission of submissions) {
    if (submission.imageUrl && submission.imageUrl.startsWith(publicUrl)) {
      urlToRecord.set(submission.imageUrl, {
        type: "submission",
        userId: submission.userId,
        recordId: submission.id,
      });
    }
  }

  // Query profile images
  const users = await prisma.user.findMany({
    where: {
      profileImageUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      profileImageUrl: true,
    },
  });

  for (const user of users) {
    if (user.profileImageUrl && user.profileImageUrl.startsWith(publicUrl)) {
      urlToRecord.set(user.profileImageUrl, {
        type: "profile",
        userId: user.id,
        recordId: user.id,
      });
    }
  }

  console.log(
    `Found ${submissions.length} submission images and ${users.length} profile images in database`,
  );

  // Build migration items
  const items: MigrationItem[] = [];
  const orphaned: Array<{ key: string; size: number }> = [];

  for (const file of oldFormatFiles) {
    // Construct the URL that would be in the database
    const url = `${publicUrl}/${file.key}`;
    const record = urlToRecord.get(url);

    if (record) {
      const folder = record.type === "profile" ? "profiles" : "submissions";
      const newKey = `${folder}/${file.key}`;

      items.push({
        oldKey: file.key,
        newKey,
        type: record.type,
        userId: record.userId,
        size: file.size,
        dbRecordId: record.recordId,
        url,
      });
    } else {
      orphaned.push(file);
    }
  }

  const stats: MigrationStats = {
    totalFiles: oldFormatFiles.length,
    submissionFiles: items.filter((i) => i.type === "submission").length,
    profileFiles: items.filter((i) => i.type === "profile").length,
    orphanedFiles: orphaned.length,
    totalSize: oldFormatFiles.reduce((sum, f) => sum + f.size, 0),
    migrated: 0,
    errors: 0,
  };

  return { items, orphaned, stats };
}

async function migrateFile(
  s3Client: S3Client,
  bucketName: string,
  item: MigrationItem,
  dryRun: boolean,
  prisma: PrismaClient,
): Promise<boolean> {
  try {
    if (dryRun) {
      console.log(`[DRY RUN] Would migrate: ${item.oldKey} -> ${item.newKey}`);
      return true;
    }

    // Copy to new location
    await s3Client.send(
      new CopyObjectCommand({
        Bucket: bucketName,
        CopySource: `${bucketName}/${item.oldKey}`,
        Key: item.newKey,
      }),
    );

    // Delete old file
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: item.oldKey,
      }),
    );

    // Update database URL
    const newUrl = item.url.replace(`/${item.oldKey}`, `/${item.newKey}`);

    if (item.type === "submission") {
      await prisma.submission.update({
        where: { id: item.dbRecordId },
        data: { imageUrl: newUrl },
      });
    } else {
      await prisma.user.update({
        where: { id: item.dbRecordId },
        data: { profileImageUrl: newUrl },
      });
    }

    return true;
  } catch (error) {
    console.error(`Error migrating ${item.oldKey}:`, error);
    return false;
  }
}

function printPlan(plan: {
  items: MigrationItem[];
  orphaned: Array<{ key: string; size: number }>;
  stats: MigrationStats;
}): void {
  console.log("\n" + "=".repeat(80));
  console.log("MIGRATION PLAN");
  console.log("=".repeat(80) + "\n");

  console.log("SUMMARY");
  console.log("-".repeat(80));
  console.log(
    `Total files in old format:     ${plan.stats.totalFiles.toLocaleString()}`,
  );
  console.log(
    `  - Submission files:          ${plan.stats.submissionFiles.toLocaleString()}`,
  );
  console.log(
    `  - Profile files:             ${plan.stats.profileFiles.toLocaleString()}`,
  );
  console.log(
    `  - Orphaned (not in DB):      ${plan.orphaned.length.toLocaleString()}`,
  );
  console.log(
    `Total size to migrate:           ${formatSize(plan.stats.totalSize)}`,
  );
  console.log("");

  if (plan.orphaned.length > 0) {
    console.log("ORPHANED FILES (will not be migrated)");
    console.log("-".repeat(80));
    console.log(
      `Found ${plan.orphaned.length} files in old format that are not referenced in the database.`,
    );
    console.log("These files will be left in the old location.");
    console.log("Top 10 orphaned files:");
    for (const file of plan.orphaned.slice(0, 10)) {
      console.log(`  - ${file.key} (${formatSize(file.size)})`);
    }
    if (plan.orphaned.length > 10) {
      console.log(`  ... and ${plan.orphaned.length - 10} more`);
    }
    console.log("");
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  // Parse database URL from CLI args or env var
  const nonFlagArgs = args.filter((arg) => !arg.startsWith("--"));
  const cliUrl = nonFlagArgs[0];
  const databaseUrl =
    cliUrl ??
    process.env["PRODUCTION_DATABASE_URL"] ??
    process.env["DATABASE_URL"];

  if (!databaseUrl) {
    console.error("Error: Missing database URL.");
    console.error(
      "Provide it as an argument, or set DATABASE_URL or PRODUCTION_DATABASE_URL in the environment.",
    );
    console.error("");
    printUsage();
    process.exit(1);
  }

  // Set DATABASE_URL before importing prisma
  process.env["DATABASE_URL"] = databaseUrl;

  const dryRun = !args.includes("--execute");

  // Helper function to get env var with PRODUCTION_ fallback
  function getEnvVar(name: string): string | undefined {
    return process.env[`PRODUCTION_${name}`] ?? process.env[name];
  }

  // Get R2 environment variables (check PRODUCTION_ prefix first)
  const r2AccountId = getEnvVar("R2_ACCOUNT_ID");
  const r2AccessKeyId = getEnvVar("R2_ACCESS_KEY_ID");
  const r2SecretAccessKey = getEnvVar("R2_SECRET_ACCESS_KEY");
  const r2BucketName = getEnvVar("R2_BUCKET_NAME");
  const r2PublicUrl = getEnvVar("R2_PUBLIC_URL");

  // Validate environment variables
  const missingVars: string[] = [];
  if (!r2AccountId)
    missingVars.push("R2_ACCOUNT_ID or PRODUCTION_R2_ACCOUNT_ID");
  if (!r2AccessKeyId)
    missingVars.push("R2_ACCESS_KEY_ID or PRODUCTION_R2_ACCESS_KEY_ID");
  if (!r2SecretAccessKey)
    missingVars.push("R2_SECRET_ACCESS_KEY or PRODUCTION_R2_SECRET_ACCESS_KEY");
  if (!r2BucketName)
    missingVars.push("R2_BUCKET_NAME or PRODUCTION_R2_BUCKET_NAME");
  if (!r2PublicUrl)
    missingVars.push("R2_PUBLIC_URL or PRODUCTION_R2_PUBLIC_URL");

  if (missingVars.length > 0) {
    console.error("Error: Missing required environment variables:");
    for (const varName of missingVars) {
      console.error(`  - ${varName}`);
    }
    process.exit(1);
  }

  // Dynamically import prisma after setting DATABASE_URL
  const { prisma } = await import("@/lib/prisma");

  // Show masked database URL
  const maskedUrl = databaseUrl.replace(/\/\/([^:@/]+):([^@/]+)@/, "//$1:***@");
  console.log(`Using DATABASE_URL: ${maskedUrl}`);
  console.log(`Using R2_BUCKET_NAME: ${r2BucketName}`);
  console.log(`Using R2_PUBLIC_URL: ${r2PublicUrl}`);
  console.log("");

  // Initialize S3Client (we've validated these exist above)
  const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${r2AccountId!}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId!,
      secretAccessKey: r2SecretAccessKey!,
    },
  });

  try {
    // Build migration plan
    const plan = await buildMigrationPlan(
      s3Client,
      r2BucketName!,
      r2PublicUrl!,
      prisma,
    );
    printPlan(plan);

    if (dryRun) {
      console.log("\n" + "=".repeat(80));
      console.log("DRY RUN MODE - No changes will be made");
      console.log("=".repeat(80));
      console.log("\nTo execute the migration, run:");
      console.log("  bun run scripts/migrate-r2-folders.ts --execute");
      console.log("");
      return;
    }

    // Confirm execution
    console.log("\n" + "=".repeat(80));
    console.log("READY TO EXECUTE MIGRATION");
    console.log("=".repeat(80));
    console.log(
      `This will migrate ${plan.items.length} files and update ${plan.items.length} database records.`,
    );
    console.log("");

    // Execute migration
    console.log("Starting migration...\n");
    let migrated = 0;
    let errors = 0;

    for (let i = 0; i < plan.items.length; i++) {
      const item = plan.items[i];
      const success = await migrateFile(
        s3Client,
        r2BucketName!,
        item,
        false,
        prisma,
      );

      if (success) {
        migrated++;
      } else {
        errors++;
      }

      if ((i + 1) % 10 === 0 || i === plan.items.length - 1) {
        console.log(
          `Progress: ${i + 1}/${plan.items.length} (${migrated} migrated, ${errors} errors)`,
        );
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("MIGRATION COMPLETE");
    console.log("=".repeat(80));
    console.log(`Migrated: ${migrated}/${plan.items.length} files`);
    console.log(`Errors:   ${errors}`);
    console.log("");
  } catch (error) {
    console.error("Error during migration:", error);
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
