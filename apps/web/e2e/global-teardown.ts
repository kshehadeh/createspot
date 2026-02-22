import type { FullConfig } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";
import { readRunTimestamp, clearRunTimestamp } from "./helpers/run-timestamp";
import { getTestUser, cleanupTestData, disconnectPrisma } from "./helpers/db";

async function globalTeardown(_config: FullConfig) {
  dotenvConfig({ path: resolve(process.cwd(), "../../.env"), override: true });
  dotenvConfig({ path: resolve(process.cwd(), ".env"), override: true });

  console.log("[E2E Teardown] Starting cleanup...");

  const runStart = readRunTimestamp();
  if (!runStart) {
    console.log("[E2E Teardown] No run timestamp found, skipping cleanup");
    return;
  }

  try {
    const testUser = await getTestUser();
    if (!testUser) {
      console.log("[E2E Teardown] Test user not found, skipping cleanup");
      return;
    }

    console.log(
      `[E2E Teardown] Cleaning up data created since ${runStart.toISOString()}`,
    );
    await cleanupTestData(testUser.id, runStart);

    console.log("[E2E Teardown] Cleanup complete!");
  } catch (error) {
    console.error("[E2E Teardown] Error during cleanup:", error);
  } finally {
    clearRunTimestamp();
    await disconnectPrisma();
  }
}

export default globalTeardown;
