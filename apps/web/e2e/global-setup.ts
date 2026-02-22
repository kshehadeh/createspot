import { chromium, type FullConfig } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";
import { writeRunTimestamp } from "./helpers/run-timestamp";
import {
  getTestUser,
  getCurrentPrompt,
  createTestPrompt,
  prisma,
} from "./helpers/db";

const AUTH_STATE_PATH = "./e2e/.auth/user.json";

async function globalSetup(config: FullConfig) {
  dotenvConfig({ path: resolve(process.cwd(), "../../.env"), override: false });
  dotenvConfig({ path: resolve(process.cwd(), ".env"), override: false });

  const baseURL = config.projects[0].use.baseURL || "http://localhost:3000";

  writeRunTimestamp(new Date());

  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in environment",
    );
  }

  console.log("[E2E Setup] Starting authentication flow...");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseURL}/welcome`);
    await page.waitForLoadState("networkidle");

    const signInButton = page.getByRole("button", {
      name: /continue with google/i,
    });
    await signInButton.click();

    await page.waitForURL(/accounts\.google\.com/, { timeout: 10000 });

    await page.fill('input[type="email"]', email);
    await page.click("#identifierNext");

    await page.waitForSelector('input[type="password"]', {
      state: "visible",
      timeout: 10000,
    });
    await page.fill('input[type="password"]', password);
    await page.click("#passwordNext");

    await page.waitForURL((url) => url.origin === baseURL, { timeout: 30000 });

    console.log("[E2E Setup] Authentication successful, saving state...");
    await context.storageState({ path: AUTH_STATE_PATH });
  } catch (error) {
    console.error("[E2E Setup] Authentication failed:", error);
    await page.screenshot({ path: "./e2e/.auth/setup-failure.png" });
    throw error;
  } finally {
    await browser.close();
  }

  console.log("[E2E Setup] Ensuring test prompt exists...");
  let testUser = await getTestUser();

  if (!testUser) {
    console.log("[E2E Setup] Waiting for user to be created in database...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    testUser = await getTestUser();
  }

  if (!testUser) {
    throw new Error(`Test user with email ${email} not found in database`);
  }

  const existingPrompt = await getCurrentPrompt();
  if (!existingPrompt) {
    console.log("[E2E Setup] Creating test prompt...");
    await createTestPrompt(testUser.id);
  } else {
    console.log("[E2E Setup] Active prompt already exists:", existingPrompt.id);
  }

  await prisma.$disconnect();
  console.log("[E2E Setup] Complete!");
}

export default globalSetup;
