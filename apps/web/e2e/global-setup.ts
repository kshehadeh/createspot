import { chromium, type FullConfig } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "node:path";
import { writeRunTimestamp } from "./helpers/run-timestamp";
import {
  getTestUser,
  getCurrentPrompt,
  createTestPrompt,
  disconnectPrisma,
} from "./helpers/db";

const AUTH_STATE_PATH = "./e2e/.auth/user.json";

async function globalSetup(config: FullConfig) {
  dotenvConfig({ path: resolve(process.cwd(), "../../.env"), override: true });
  dotenvConfig({ path: resolve(process.cwd(), ".env"), override: true });

  const baseURL = config.projects[0].use.baseURL || "http://localhost:3000";
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  const bootstrapSecret = process.env.E2E_BOOTSTRAP_SECRET;

  if (!email || !password) {
    throw new Error(
      "E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in environment",
    );
  }
  if (!bootstrapSecret) {
    throw new Error("E2E_BOOTSTRAP_SECRET must be set for credentials login");
  }

  const normalizedEmail = email.trim().toLowerCase();

  writeRunTimestamp(new Date());

  console.log("[E2E Setup] Bootstrapping test user and authenticating...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL });
  const request = context.request;

  try {
    const bootstrapRes = await request.post("/api/test/users", {
      data: { email: normalizedEmail, password },
      headers: { Authorization: `Bearer ${bootstrapSecret}` },
    });
    if (!bootstrapRes.ok()) {
      const body = await bootstrapRes.text();
      throw new Error(`Bootstrap API failed: ${bootstrapRes.status()} ${body}`);
    }

    const csrfRes = await request.get("/api/auth/csrf");
    const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
    if (!csrfToken) {
      throw new Error("Failed to get CSRF token");
    }

    const signInRes = await request.post("/api/auth/callback/credentials", {
      headers: {
        "X-Auth-Return-Redirect": "1",
      },
      form: {
        csrfToken,
        callbackUrl: baseURL,
        username: normalizedEmail,
        password,
      },
    });
    if (!signInRes.ok()) {
      const body = await signInRes.text();
      throw new Error(
        `Credentials sign-in failed: ${signInRes.status()} ${body}`,
      );
    }

    // Auth.js returns 200 even when credentials fail. Validate response URL.
    const signInData = (await signInRes.json()) as { url?: string };
    if (!signInData.url) {
      throw new Error("Credentials sign-in did not return redirect URL");
    }
    const signInUrl = new URL(signInData.url, baseURL);
    const signInError = signInUrl.searchParams.get("error");
    if (signInError) {
      throw new Error(
        `Credentials sign-in returned error: ${signInError} (${signInUrl.toString()})`,
      );
    }

    // Verify auth cookie/session was actually established.
    const sessionRes = await request.get("/api/auth/session");
    if (!sessionRes.ok()) {
      throw new Error(`Session check failed: ${sessionRes.status()}`);
    }
    const session = (await sessionRes.json()) as {
      user?: { email?: string | null } | null;
    } | null;
    if (!session?.user?.email) {
      throw new Error(
        "Credentials sign-in did not create an authenticated session",
      );
    }
    if (session.user.email.toLowerCase() !== normalizedEmail) {
      throw new Error(
        `Authenticated as unexpected user: ${session.user.email} (expected ${normalizedEmail})`,
      );
    }

    await context.storageState({ path: AUTH_STATE_PATH });
    console.log("[E2E Setup] Authentication successful, state saved.");
  } catch (error) {
    console.error("[E2E Setup] Authentication failed:", error);
    await context
      .newPage()
      .then((p) => p.screenshot({ path: "./e2e/.auth/setup-failure.png" }))
      .catch(() => {});
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
    throw new Error(
      `Test user with email ${normalizedEmail} not found in database`,
    );
  }

  const existingPrompt = await getCurrentPrompt();
  if (!existingPrompt) {
    console.log("[E2E Setup] Creating test prompt...");
    await createTestPrompt(testUser.id);
  } else {
    console.log("[E2E Setup] Active prompt already exists:", existingPrompt.id);
  }

  await disconnectPrisma();
  console.log("[E2E Setup] Complete!");
}

export default globalSetup;
