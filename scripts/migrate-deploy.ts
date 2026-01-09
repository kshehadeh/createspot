#!/usr/bin/env bun

import { spawn } from "node:child_process";

function printUsage(): void {
  console.log(
    [
      "Usage:",
      "  bun scripts/migrate-deploy.ts [databaseUrl]",
      "",
      "Examples:",
      "  bun scripts/migrate-deploy.ts postgresql://user:pass@host:5432/dbname",
      "  PRODUCTION_DATABASE_URL=postgresql://user:pass@host:5432/dbname bun scripts/migrate-deploy.ts",
      "",
      "Notes:",
      "  - If [databaseUrl] is not provided, this script uses the existing DATABASE_URL env var.",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const cliUrl = args[0];
  const databaseUrl = cliUrl ?? process.env["PRODUCTION_DATABASE_URL"];

  if (!databaseUrl) {
    console.error("Error: Missing database URL.");
    console.error(
      "Provide it as an argument, or set DATABASE_URL in the environment.",
    );
    console.error("");
    printUsage();
    process.exit(1);
  }

  process.env["DATABASE_URL"] = databaseUrl;

  console.log("Running: prisma migrate deploy");
  console.log(
    `Using DATABASE_URL: ${databaseUrl.replace(/\/\/([^:@/]+):([^@/]+)@/, "//$1:***@")}`,
  );

  const exitCode = await new Promise<number>((resolve) => {
    const child = spawn("bunx", ["prisma", "migrate", "deploy"], {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: "inherit",
    });

    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });

  process.exit(exitCode);
}

main().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
