#!/usr/bin/env bun

import { generateSlug } from "@/lib/utils";
import { ensureUniqueSlug } from "@/lib/slug-utils";

function printUsage(): void {
  console.log(
    [
      "Usage:",
      "  bun scripts/generate-user-slugs.ts [databaseUrl] [--execute]",
      "",
      "Arguments:",
      "  [databaseUrl]  Optional database URL. If not provided, uses DATABASE_URL env var.",
      "",
      "Options:",
      "  --execute      Execute the migration (default is dry-run)",
      "  --help, -h     Show this help message",
      "",
      "Examples:",
      "  bun scripts/generate-user-slugs.ts",
      "  bun scripts/generate-user-slugs.ts --execute",
      "  bun scripts/generate-user-slugs.ts postgresql://user:pass@host:5432/dbname --execute",
      "",
      "Notes:",
      "  - By default, runs in dry-run mode (preview only)",
      "  - Use --execute to actually generate and save slugs",
      "  - Users without names will be skipped (will use ID fallback)",
    ].join("\n"),
  );
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

  // Dynamically import prisma after setting DATABASE_URL
  const { prisma } = await import("@/lib/prisma");

  // Show masked database URL
  const maskedUrl = databaseUrl.replace(/\/\/([^:@/]+):([^@/]+)@/, "//$1:***@");
  console.log(`Using DATABASE_URL: ${maskedUrl}`);
  console.log("");

  try {
    // Fetch all users without slugs
    console.log("Fetching users without slugs...");
    const users = await prisma.user.findMany({
      where: {
        slug: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    console.log(`Found ${users.length} users without slugs\n`);

    if (users.length === 0) {
      console.log("All users already have slugs. Nothing to do.");
      return;
    }

    // Generate slugs for each user
    const results: Array<{
      userId: string;
      name: string | null;
      generatedSlug: string | null;
      status: "success" | "skipped" | "error";
      error?: string;
    }> = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`[${i + 1}/${users.length}] Processing user ${user.id}...`);

      if (!user.name || user.name.trim() === "") {
        console.log(`  ⚠️  Skipped: User has no name (will use ID fallback)`);
        results.push({
          userId: user.id,
          name: user.name,
          generatedSlug: null,
          status: "skipped",
        });
        continue;
      }

      try {
        const baseSlug = generateSlug(user.name);
        if (!baseSlug) {
          console.log(`  ⚠️  Skipped: Generated slug is empty`);
          results.push({
            userId: user.id,
            name: user.name,
            generatedSlug: null,
            status: "skipped",
          });
          continue;
        }

        const uniqueSlug = await ensureUniqueSlug(baseSlug);

        if (dryRun) {
          console.log(
            `  ✓ Would generate slug: "${baseSlug}" -> "${uniqueSlug}"`,
          );
        } else {
          await prisma.user.update({
            where: { id: user.id },
            data: { slug: uniqueSlug },
          });
          console.log(`  ✓ Generated slug: "${baseSlug}" -> "${uniqueSlug}"`);
        }

        results.push({
          userId: user.id,
          name: user.name,
          generatedSlug: uniqueSlug,
          status: "success",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`  ✗ Error: ${errorMessage}`);
        results.push({
          userId: user.id,
          name: user.name,
          generatedSlug: null,
          status: "error",
          error: errorMessage,
        });
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    const successful = results.filter((r) => r.status === "success").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;

    console.log(`Total users processed: ${results.length}`);
    console.log(`  ✓ Successfully generated: ${successful}`);
    console.log(`  ⚠️  Skipped (no name): ${skipped}`);
    console.log(`  ✗ Errors: ${errors}`);

    if (dryRun) {
      console.log("\n" + "=".repeat(80));
      console.log("DRY RUN MODE - No changes were made");
      console.log("=".repeat(80));
      console.log("\nTo execute the migration, run:");
      console.log("  bun scripts/generate-user-slugs.ts --execute");
      console.log("");
    } else {
      console.log("\n" + "=".repeat(80));
      console.log("MIGRATION COMPLETE");
      console.log("=".repeat(80));
      console.log("");
    }

    if (errors > 0) {
      console.log("Users with errors:");
      for (const result of results.filter((r) => r.status === "error")) {
        console.log(`  - ${result.userId}: ${result.error}`);
      }
    }
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
